import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getDb } from "../db/client";
import { sequences } from "../db/schema";
import { requireUserId } from "../lib/current-user";
import { assertProjectOwner } from "../lib/ownership";

const sequenceParams = t.Object({ id: t.String({ format: "uuid" }) });

const sequenceBody = t.Object({
	recordId: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	description: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
	format: t.String({ minLength: 1, maxLength: 32 }),
	sequenceLength: t.Integer({ minimum: 1 }),
	sequenceHash: t.String({ minLength: 1, maxLength: 128 }),
});

export const sequencesRoutes = new Elysia()
	.post(
		"/projects/:id/sequences",
		async ({ params, body, status }) => {
			const userId = await requireUserId();
			await assertProjectOwner(params.id, userId);

			const [sequence] = await getDb()
				.insert(sequences)
				.values({
					projectId: params.id,
					recordId: body.recordId ?? null,
					description: body.description ?? null,
					format: body.format,
					sequenceLength: body.sequenceLength,
					sequenceHash: body.sequenceHash,
				})
				.returning();

			return status(201, { data: sequence });
		},
		{ params: sequenceParams, body: sequenceBody },
	)
	.get(
		"/projects/:id/sequences",
		async ({ params }) => {
			const userId = await requireUserId();
			await assertProjectOwner(params.id, userId);

			const data = await getDb()
				.select()
				.from(sequences)
				.where(eq(sequences.projectId, params.id))
				.orderBy(desc(sequences.createdAt));

			return { data };
		},
		{ params: sequenceParams },
	);
