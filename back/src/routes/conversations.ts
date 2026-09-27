import { asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getDb } from "../db/client";
import { conversations } from "../db/schema";
import { requireUserId } from "../lib/current-user";
import { assertProjectOwner } from "../lib/ownership";

const conversationParams = t.Object({ projectId: t.String({ format: "uuid" }) });

const conversationBody = t.Object({
	projectId: t.String({ format: "uuid" }),
	role: t.String({ minLength: 1, maxLength: 32 }),
	content: t.String({ minLength: 1, maxLength: 100000 }),
}, { additionalProperties: false });

export const conversationsRoutes = new Elysia()
	.get(
		"/conversations/:projectId",
		async ({ params }) => {
			const userId = await requireUserId();
			await assertProjectOwner(params.projectId, userId);

			const data = await getDb()
				.select()
				.from(conversations)
				.where(eq(conversations.projectId, params.projectId))
				.orderBy(asc(conversations.createdAt));

			return { data };
		},
		{ params: conversationParams },
	)
	.post(
		"/conversations",
		async ({ body, status }) => {
			const userId = await requireUserId();
			await assertProjectOwner(body.projectId, userId);

			const [conversation] = await getDb()
				.insert(conversations)
				.values({
					projectId: body.projectId,
					role: body.role,
					content: body.content,
				})
				.returning();

			return status(201, { data: conversation });
		},
		{ body: conversationBody },
	);
