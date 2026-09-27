import { beforeAll, describe, expect, test } from "bun:test";

import { API_URL, createClient } from "../helpers/client";
import { projectCounts } from "../helpers/db";
import { buildGuestImport } from "../helpers/fixtures";
import { assertStackReady } from "../helpers/setup";

const api = createClient();

beforeAll(async () => {
	await assertStackReady(API_URL);
});

describe("guest import", () => {
	test("imports a project tree and persists it to postgres", async () => {
		api.clearSession();
		await api.createUser("guest");
		const { projectId, payload } = buildGuestImport();

		const result = await api.post("/guest/import", payload);

		expect(result.status).toBe(201);
		expect(result.body.data.projects[0].projectId).toBe(projectId);

		const counts = await projectCounts(projectId);

		expect(counts.projects).toBe(1);
		expect(counts.sequences).toBe(1);
		expect(counts.conversations).toBe(1);
	}, 30_000);

	test("replaying the same ids is idempotent", async () => {
		api.clearSession();
		await api.createUser("idem");
		const { projectId, payload } = buildGuestImport();

		expect((await api.post("/guest/import", payload)).status).toBe(201);
		expect((await api.post("/guest/import", payload)).status).toBe(201);

		const counts = await projectCounts(projectId);

		expect(counts.projects).toBe(1);
		expect(counts.sequences).toBe(1);
	}, 30_000);

	test("rejects server-owned lifecycle fields with 422", async () => {
		api.clearSession();
		await api.createUser("reject");

		// Each guard is declared at the level it belongs to: userId on the
		// project, objectKey on the sequence, queueJobId on the analysis.
		const withProjectField = (field: string) => {
			const { payload } = buildGuestImport();

			return {
				...payload,
				projects: [{ ...payload.projects[0], [field]: "injected" }],
			};
		};

		const withSequenceField = (field: string) => {
			const { payload } = buildGuestImport();
			const project = payload.projects[0];

			return {
				...payload,
				projects: [
					{
						...project,
						sequences: [{ ...project.sequences[0], [field]: "injected" }],
					},
				],
			};
		};

		const withAnalysisField = (field: string) => {
			const { payload } = buildGuestImport();
			const project = payload.projects[0];
			const sequence = project.sequences[0];

			return {
				...payload,
				projects: [
					{
						...project,
						sequences: [
							{
								...sequence,
								analyses: [{ ...sequence.analyses[0], [field]: "injected" }],
							},
						],
					},
				],
			};
		};

		for (const attempt of [
			withProjectField("userId"),
			withSequenceField("objectKey"),
			withAnalysisField("queueJobId"),
		]) {
			expect((await api.post("/guest/import", attempt)).status).toBe(422);
		}
	});

	test("refuses an anonymous caller with 401", async () => {
		api.clearSession();
		const { payload } = buildGuestImport();

		expect((await api.post("/guest/import", payload)).status).toBe(401);
	});

	test("imports a project with no analyses or conversations", async () => {
		api.clearSession();
		await api.createUser("sparse");
		const { projectId, payload } = buildGuestImport({
			withAnalysis: false,
			withConversations: false,
		});

		const result = await api.post("/guest/import", payload);

		expect(result.status).toBe(201);
		expect(result.body.data.projects[0].counts).toEqual({
			sequences: 1,
			analyses: 0,
			conversations: 0,
		});

		const counts = await projectCounts(projectId);

		expect(counts.sequences).toBe(1);
		expect(counts.conversations).toBe(0);
	}, 30_000);
});
