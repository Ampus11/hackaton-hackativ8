import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getDb } from "../db/client";
import { analyses } from "../db/schema";
import { ApiError } from "../lib/api-error";
import { requireUserId } from "../lib/current-user";
import { findOwnedAnalysis, findOwnedSequence } from "../lib/ownership";
import { assertQueueConfigured, enqueueAnalysis } from "../lib/queue";

const analysisParams = t.Object({ id: t.String({ format: "uuid" }) });

const analysisBody = t.Object({
	sequenceId: t.String({ format: "uuid" }),
	analysisType: t.String({ minLength: 1, maxLength: 64 }),
});

const failureMessage = (error: unknown) => {
	if (error instanceof ApiError) return error.message;
	if (error instanceof Error) return error.message;
	return "Unknown error";
};

export const analysesRoutes = new Elysia()
	.post(
		"/analyses",
		async ({ body, status }) => {
			const userId = await requireUserId();
			const sequence = await findOwnedSequence(body.sequenceId, userId);

			assertQueueConfigured();

			const [created] = await getDb()
				.insert(analyses)
				.values({
					sequenceId: sequence.id,
					analysisType: body.analysisType,
					status: "queued",
				})
				.returning();

			try {
				const queueJobId = await enqueueAnalysis({
					analysisId: created.id,
					sequenceId: sequence.id,
					projectId: sequence.projectId,
					analysisType: body.analysisType,
				});

				const [queued] = await getDb()
					.update(analyses)
					.set({ queueJobId, updatedAt: new Date() })
					.where(eq(analyses.id, created.id))
					.returning();

				return status(202, { data: queued });
			} catch (error) {
				console.error(`[analyses] enqueue failed for ${created.id}:`, error);

				await getDb()
					.update(analyses)
					.set({
						status: "failed",
						errorMessage: failureMessage(error).slice(0, 2000),
						updatedAt: new Date(),
					})
					.where(eq(analyses.id, created.id));

				throw new ApiError(
					503,
					"QUEUE_UNAVAILABLE",
					"The analysis could not be queued. Please retry later.",
					{ analysisId: created.id, status: "failed" },
				);
			}
		},
		{ body: analysisBody },
	)
	.get(
		"/analyses/:id",
		async ({ params }) => {
			const userId = await requireUserId();
			const analysis = await findOwnedAnalysis(params.id, userId);
			return { data: analysis };
		},
		{ params: analysisParams },
	)
	.get(
		"/analyses/:id/status",
		async ({ params }) => {
			const userId = await requireUserId();
			const analysis = await findOwnedAnalysis(params.id, userId);

			return {
				data: {
					id: analysis.id,
					status: analysis.status,
					queueJobId: analysis.queueJobId,
					errorMessage: analysis.errorMessage,
					updatedAt: analysis.updatedAt,
				},
			};
		},
		{ params: analysisParams },
	);
