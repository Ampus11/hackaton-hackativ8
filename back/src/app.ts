import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { getDb } from "./db/client";
import { ApiError, errorBody } from "./lib/api-error";
import { analysesRoutes } from "./routes/analyses";
import { authRoutes } from "./routes/auth";
import { conversationsRoutes } from "./routes/conversations";
import { guestRoutes } from "./routes/guest";
import { projectsRoutes } from "./routes/projects";
import { sequencesRoutes } from "./routes/sequences";
import { storageRoutes } from "./routes/storage";

/**
 * Origins allowed to call the API with a session cookie.
 *
 * The frontend and the API are served from different origins, so CORS is
 * required. It cannot be a wildcard: the browser refuses `Access-Control-
 * Allow-Origin: *` on a credentialed request, and the session cookie is the
 * whole point. So this is an explicit allowlist from `CORS_ORIGINS`, and an
 * empty list means no cross-origin caller is allowed.
 */
const corsOrigins = () =>
	(process.env.CORS_ORIGINS ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0 && origin !== "*");

/**
 * Builds the Elysia app once so the API and the analysis worker share routes.
 *
 * The API runs on the VPS next to PostgreSQL, Redis and MinIO, so it uses the
 * default adapter. The database client speaks TCP, which rules out runtimes
 * without raw socket support.
 */
export const createApp = () => {
	const origins = corsOrigins();

	return new Elysia()
		.onRequest(({ request, set }) => {
			const origin = request.headers.get("origin");

			if (origin && origins.includes(origin)) {
				set.headers["access-control-allow-origin"] = origin;
				set.headers["access-control-allow-credentials"] = "true";
				set.headers["access-control-allow-headers"] = "content-type";
				set.headers["access-control-allow-methods"] = "GET,POST,DELETE,OPTIONS";
				set.headers["vary"] = "Origin";
			}
		})
		.options("*", () => new Response(null, { status: 204 }))
		.onError(({ code, error, set }) => {
			if (error instanceof ApiError) {
				set.status = error.statusCode;
				return errorBody(error.code, error.message, error.details);
			}

			if (code === "VALIDATION") {
				set.status = 422;
				return errorBody("VALIDATION_ERROR", "Request validation failed.");
			}

			if (code === "NOT_FOUND") {
				set.status = 404;
				return errorBody("ROUTE_NOT_FOUND", "Route not found.");
			}

			console.error(error);
			set.status = 500;
			return errorBody("INTERNAL_ERROR", "Internal server error.");
		})
		.get("/", () => ({ service: "back", status: "ok" }))
		.get("/health", async ({ set }) => {
			try {
				await getDb().execute(sql`select 1`);
				return { status: "ok", database: "connected" };
			} catch {
				set.status = 503;
				return { status: "degraded", database: "unavailable" };
			}
		})
		.use(authRoutes)
		.use(guestRoutes)
		.use(projectsRoutes)
		.use(sequencesRoutes)
		.use(analysesRoutes)
		.use(conversationsRoutes)
		.use(storageRoutes);
};
