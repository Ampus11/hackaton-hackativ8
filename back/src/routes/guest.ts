import { Elysia, t } from "elysia";

import { getDb, getSql } from "../db/client";
import {
	analyses,
	conversations,
	projects,
	sequences,
} from "../db/schema";
import { ApiError } from "../lib/api-error";
import { requireUserId } from "../lib/current-user";

const MAX_PROJECTS = 50;
const MAX_SEQUENCES_PER_PROJECT = 200;
const MAX_ANALYSES_PER_SEQUENCE = 100;
const MAX_CONVERSATIONS_PER_PROJECT = 500;
const MAX_RESULT_BYTES = 64 * 1024;

const optionalUuid = t.Optional(t.String({ format: "uuid" }));
const optionalText = (max: number) => t.Optional(t.String({ maxLength: max }));
const optionalTimestamp = t.Optional(t.String({ format: "date-time" }));

/**
 * Guest records are keyed by the ids the browser already assigned in IndexedDB.
 *
 * Reusing them makes the import idempotent: a retry after a partial failure
 * re-sends the same ids, `on conflict do nothing` skips what already landed, and
 * the client converges without creating duplicates.
 */
const guestAnalysis = t.Object(
	{
		id: optionalUuid,
		sequenceId: t.String({ format: "uuid" }),
		analysisType: t.String({ minLength: 1, maxLength: 64 }),
		status: t.Optional(
			t.Union([t.Literal("completed"), t.Literal("failed")]),
		),
		resultJson: t.Optional(t.Record(t.String(), t.Unknown())),
		errorMessage: optionalText(2000),
		createdAt: optionalTimestamp,

		// Owned by the API and the worker; a guest has no queue and no account.
		queueJobId: t.Optional(t.Never()),
		updatedAt: t.Optional(t.Never()),
	},
	{ additionalProperties: false },
);

const guestSequence = t.Object(
	{
		id: optionalUuid,
		recordId: optionalText(500),
		description: optionalText(2000),
		format: t.String({ minLength: 1, maxLength: 16 }),
		sequenceLength: t.Optional(t.Integer({ min: 0 })),
		sequenceHash: optionalText(128),
		originalFilename: optionalText(255),
		analyses: t.Optional(
			t.Array(guestAnalysis, { maxItems: MAX_ANALYSES_PER_SEQUENCE }),
		),
		createdAt: optionalTimestamp,

		// The guest browser has no object storage, so it can never own an object.
		objectKey: t.Optional(t.Never()),
		projectId: t.Optional(t.Never()),
	},
	{ additionalProperties: false },
);

const guestProject = t.Object(
	{
		id: optionalUuid,
		name: t.String({ minLength: 1, maxLength: 120 }),
		sequences: t.Optional(
			t.Array(guestSequence, { maxItems: MAX_SEQUENCES_PER_PROJECT }),
		),
		conversations: t.Optional(
			t.Array(
				t.Object(
					{
						id: optionalUuid,
						role: t.String({ minLength: 1, maxLength: 32 }),
						content: t.String({ minLength: 1, maxLength: 20_000 }),
						createdAt: optionalTimestamp,
					},
					{ additionalProperties: false },
				),
				{ maxItems: MAX_CONVERSATIONS_PER_PROJECT },
			),
		),
		createdAt: optionalTimestamp,
		userId: t.Optional(t.Never()),
	},
	{ additionalProperties: false },
);

const importBody = t.Object(
	{
		projects: t.Array(guestProject, { minItems: 1, maxItems: MAX_PROJECTS }),
	},
	{ additionalProperties: false },
);

type GuestAnalysis = {
	id?: string;
	sequenceId: string;
	analysisType: string;
	status?: "completed" | "failed";
	resultJson?: Record<string, unknown>;
	errorMessage?: string;
	createdAt?: string;
};

type GuestSequence = {
	id?: string;
	recordId?: string;
	description?: string;
	format: string;
	sequenceLength?: number;
	sequenceHash?: string;
	originalFilename?: string;
	analyses?: GuestAnalysis[];
	createdAt?: string;
};

type GuestProject = {
	id?: string;
	name: string;
	sequences?: GuestSequence[];
	conversations?: { id?: string; role: string; content: string; createdAt?: string }[];
	createdAt?: string;
};

const asDate = (value: string | undefined) =>
	value ? new Date(value) : new Date();

/**
 * Guest analyses were already computed in the browser, so `completed` is the
 * honest default. A record that claims work still in flight lands as `failed`
 * rather than pretending a server-side job exists for it.
 */
const importedStatus = (analysis: GuestAnalysis, hasResult: boolean) => {
	if (analysis.status === "failed") {
		return "failed" as const;
	}
	if (analysis.status === "completed") {
		return "completed" as const;
	}
	return hasResult ? ("completed" as const) : ("failed" as const);
};

type ImportedCounts = {
	sequences: number;
	analyses: number;
	conversations: number;
};

const importProject = async (
	project: GuestProject,
	userId: string,
): Promise<{ projectId: string; counts: ImportedCounts }> => {
	const projectId = project.id ?? crypto.randomUUID();
	const statements = [];

	statements.push(
		getDb()
			.insert(projects)
			.values({
				id: projectId,
				userId,
				name: project.name.trim(),
				createdAt: asDate(project.createdAt),
			})
			.onConflictDoNothing()
			.toSQL(),
	);

	let analysisCount = 0;

	for (const sequence of project.sequences ?? []) {
		const sequenceId = sequence.id ?? crypto.randomUUID();

		statements.push(
			getDb()
				.insert(sequences)
				.values({
					id: sequenceId,
					projectId,
					recordId: sequence.recordId ?? null,
					description: sequence.description ?? null,
					format: sequence.format,
					sequenceLength: sequence.sequenceLength ?? null,
					sequenceHash: sequence.sequenceHash ?? null,
					originalFilename: sequence.originalFilename ?? null,
					createdAt: asDate(sequence.createdAt),
				})
				.onConflictDoNothing()
				.toSQL(),
		);

		for (const analysis of sequence.analyses ?? []) {
			const resultJson = analysis.resultJson ?? null;
			const serialized = resultJson ? JSON.stringify(resultJson) : "";

			if (serialized.length > MAX_RESULT_BYTES) {
				throw new ApiError(
					413,
					"RESULT_TOO_LARGE",
					`Analysis result exceeds ${MAX_RESULT_BYTES} bytes.`,
					{ analysisId: analysis.id ?? null },
				);
			}

			statements.push(
				getDb()
					.insert(analyses)
					.values({
						id: analysis.id ?? crypto.randomUUID(),
						sequenceId: analysis.sequenceId,
						analysisType: analysis.analysisType,
						status: importedStatus(analysis, serialized.length > 0),
						// Never trusted from the client: it would collide with the
						// unique index and imply a server-side job that does not exist.
						queueJobId: null,
						resultJson: resultJson as Record<string, unknown> | null,
						errorMessage: analysis.errorMessage ?? null,
						createdAt: asDate(analysis.createdAt),
					})
					.onConflictDoNothing()
					.toSQL(),
			);

			analysisCount += 1;
		}
	}

	for (const conversation of project.conversations ?? []) {
		statements.push(
			getDb()
				.insert(conversations)
				.values({
					id: conversation.id ?? crypto.randomUUID(),
					projectId,
					role: conversation.role,
					content: conversation.content,
					createdAt: asDate(conversation.createdAt),
				})
				.onConflictDoNothing()
				.toSQL(),
		);
	}

	// One implicit transaction per project: either the whole tree lands or none
	// of it does, so a failure can never leave a project half-imported.
	await getSql().transaction(
		statements.map((statement) =>
			getSql().query(statement.sql, statement.params as unknown[]),
		),
	);

	return {
		projectId,
		counts: {
			sequences: project.sequences?.length ?? 0,
			analyses: analysisCount,
			conversations: project.conversations?.length ?? 0,
		},
	};
};

export const guestRoutes = new Elysia().post(
	"/guest/import",
	async ({ body, request, status }) => {
		const userId = await requireUserId(request);

		const imported = [];
		for (const [index, project] of body.projects.entries()) {
			try {
				imported.push(await importProject(project, userId));
			} catch (error) {
				if (error instanceof ApiError) {
					throw error;
				}

				console.error(`[guest] import failed at project ${index}:`, error);
				throw new ApiError(
					500,
					"GUEST_IMPORT_FAILED",
					"Guest import failed. Retry to finish; imported projects are kept.",
					{ importedProjects: imported.length, failedProjectIndex: index },
				);
			}
		}

		return status(201, { data: { projects: imported } });
	},
	{ body: importBody },
);
