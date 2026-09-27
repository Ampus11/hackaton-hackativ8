import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getDb } from "../db/client";
import { projects } from "../db/schema";
import { ApiError } from "../lib/api-error";
import { requireUserId } from "../lib/current-user";

const projectParams = t.Object({ id: t.String({ format: "uuid" }) });

const projectBody = t.Object({
	name: t.String({ minLength: 1, maxLength: 120 }),
});

export const projectsRoutes = new Elysia()
	.post(
		"/projects",
		async ({ body, status }) => {
			const userId = await requireUserId();
			const name = body.name.trim();

			if (name.length === 0) {
				throw new ApiError(
					422,
					"VALIDATION_ERROR",
					"Project name cannot be blank.",
				);
			}

			const [project] = await getDb()
				.insert(projects)
				.values({ userId, name })
				.returning();

			return status(201, { data: project });
		},
		{ body: projectBody },
	)
	.get("/projects", async () => {
		const userId = await requireUserId();
		const data = await getDb()
			.select()
			.from(projects)
			.where(eq(projects.userId, userId))
			.orderBy(desc(projects.createdAt));

		return { data };
	})
	.get(
		"/projects/:id",
		async ({ params }) => {
			const userId = await requireUserId();
			const [project] = await getDb()
				.select()
				.from(projects)
				.where(
					and(eq(projects.id, params.id), eq(projects.userId, userId)),
				)
				.limit(1);

			if (!project) {
				throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
			}

			return { data: project };
		},
		{ params: projectParams },
	);
