import { and, eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { analyses, projects, sequences } from "../db/schema";
import { ApiError } from "./api-error";

export const assertProjectOwner = async (
	projectId: string,
	userId: string,
): Promise<void> => {
	const [project] = await getDb()
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
		.limit(1);

	if (!project) {
		throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
	}
};

export const findOwnedSequence = async (sequenceId: string, userId: string) => {
	const [row] = await getDb()
		.select({ sequence: sequences })
		.from(sequences)
		.innerJoin(projects, eq(sequences.projectId, projects.id))
		.where(and(eq(sequences.id, sequenceId), eq(projects.userId, userId)))
		.limit(1);

	if (!row) {
		throw new ApiError(404, "SEQUENCE_NOT_FOUND", "Sequence not found.");
	}

	return row.sequence;
};

export const findOwnedSequenceByObjectKey = async (
	objectKey: string,
	userId: string,
) => {
	const [row] = await getDb()
		.select({ sequence: sequences })
		.from(sequences)
		.innerJoin(projects, eq(sequences.projectId, projects.id))
		.where(
			and(eq(sequences.objectKey, objectKey), eq(projects.userId, userId)),
		)
		.limit(1);

	if (!row) {
		throw new ApiError(404, "OBJECT_NOT_FOUND", "Stored object not found.");
	}

	return row.sequence;
};

export const findOwnedAnalysis = async (
	analysisId: string,
	userId: string,
) => {
	const [row] = await getDb()
		.select({ analysis: analyses })
		.from(analyses)
		.innerJoin(sequences, eq(analyses.sequenceId, sequences.id))
		.innerJoin(projects, eq(sequences.projectId, projects.id))
		.where(and(eq(analyses.id, analysisId), eq(projects.userId, userId)))
		.limit(1);

	if (!row) {
		throw new ApiError(404, "ANALYSIS_NOT_FOUND", "Analysis not found.");
	}

	return row.analysis;
};
