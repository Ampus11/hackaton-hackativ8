import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { getDb } from "./db/client";
import { ApiError, errorBody } from "./lib/api-error";
import { analysesRoutes } from "./routes/analyses";
import { conversationsRoutes } from "./routes/conversations";
import { projectsRoutes } from "./routes/projects";
import { sequencesRoutes } from "./routes/sequences";
import { storageRoutes } from "./routes/storage";

const app = new Elysia({ aot: false })
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
	.use(projectsRoutes)
	.use(sequencesRoutes)
	.use(analysesRoutes)
	.use(conversationsRoutes)
	.use(storageRoutes);

export { app };
export default app;

if (typeof Bun !== "undefined" && process.env.WORKER !== "1") {
	const port = Number(process.env.PORT ?? 4000);
	app.listen(port);
	console.log(`back API listening on http://localhost:${port}`);
}
