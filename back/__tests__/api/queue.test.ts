import { beforeAll, describe, expect, test } from "bun:test";

import { API_URL, createClient } from "../helpers/client";
import { analysisById } from "../helpers/db";
import { assertStackReady } from "../helpers/setup";

const api = createClient();

const LIFECYCLE = ["queued", "processing", "completed", "failed"];

beforeAll(async () => {
	await assertStackReady(API_URL);
});

describe("analysis submission", () => {
	test("accepts a job, persists it, and exposes its status", async () => {
		api.clearSession();
		await api.createUser("queue");

		const projectId = await api.createProject("Queue project");
		const sequence = await api.createSequence(projectId);
		const sequenceId = sequence.body.data.id as string;

		const submitted = await api.post("/analyses", {
			sequenceId,
			analysisType: "blastn",
		});

		expect([200, 201, 202]).toContain(submitted.status);

		const analysisId = submitted.body.data.id as string;
		expect(typeof analysisId).toBe("string");

		const status = await api.request(`/analyses/${analysisId}/status`);

		expect(status.status).toBe(200);
		expect(LIFECYCLE).toContain(status.body.data.status);

		// the record is durable in postgres, not just in the response
		const row = await analysisById(analysisId);

		expect(row).toHaveLength(1);
		expect(row[0]!.status).toBe(status.body.data.status);
	}, 30_000);

	test("starts out queued and holds a queue job id", async () => {
		api.clearSession();
		await api.createUser("queue-2");

		const projectId = await api.createProject("Queue project 2");
		const sequence = await api.createSequence(projectId);
		const submitted = await api.post("/analyses", {
			sequenceId: sequence.body.data.id,
			analysisType: "local",
		});

		const row = await analysisById(submitted.body.data.id);

		expect(row[0]!.status).toBe("queued");
		// enqueue succeeded against Redis, so the BullMQ id is recorded
		expect(row[0]!.queue_job_id).toBeTruthy();
	}, 30_000);

	test("rejects a job for a sequence owned by someone else", async () => {
		api.clearSession();
		await api.createUser("queue-owner");

		const projectId = await api.createProject("Not yours");
		const sequence = await api.createSequence(projectId);

		api.clearSession();
		await api.createUser("queue-intruder");

		const attempt = await api.post("/analyses", {
			sequenceId: sequence.body.data.id,
			analysisType: "blastn",
		});

		expect(attempt.status).toBe(404);
	}, 30_000);

	test("rejects server-owned lifecycle fields", async () => {
		api.clearSession();
		await api.createUser("queue-guard");

		const projectId = await api.createProject("Guarded project");
		const sequence = await api.createSequence(projectId);

		const attempt = await api.post("/analyses", {
			sequenceId: sequence.body.data.id,
			analysisType: "blastn",
			status: "completed",
		});

		expect(attempt.status).toBe(422);
	}, 30_000);

	test("refuses an anonymous submission", async () => {
		api.clearSession();

		expect(
			(await api.post("/analyses", { sequenceId: crypto.randomUUID(), analysisType: "blastn" })).status,
		).toBe(401);
	});
});
