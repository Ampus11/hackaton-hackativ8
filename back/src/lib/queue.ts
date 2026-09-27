import type { ConnectionOptions, Queue as BullQueue } from "bullmq";

import { ApiError } from "./api-error";

export const ANALYSIS_QUEUE = "genomic-analysis";

export type AnalysisJob = {
	analysisId: string;
	sequenceId: string;
	projectId: string;
	analysisType: string;
};

const DEFAULT_ATTEMPTS = 3;

export const isQueueConfigured = () =>
	Boolean(process.env.REDIS_URL) || Boolean(process.env.QUEUE_ENQUEUE_URL);

export const assertQueueConfigured = () => {
	if (!isQueueConfigured()) {
		throw new ApiError(
			503,
			"QUEUE_NOT_CONFIGURED",
			"The analysis queue is not configured.",
		);
	}
};

const producerConnection = (): ConnectionOptions => {
	const url = process.env.REDIS_URL;
	if (!url) {
		throw new ApiError(
			503,
			"QUEUE_NOT_CONFIGURED",
			"The analysis queue is not configured.",
		);
	}

	return {
		url,
		maxRetriesPerRequest: 1,
		enableOfflineQueue: false,
		connectTimeout: 5000,
		retryStrategy: () => null,
	};
};

export const workerConnection = (): ConnectionOptions => {
	const url = process.env.REDIS_URL;
	if (!url) {
		throw new Error("REDIS_URL is required to run the analysis worker.");
	}

	return { url, maxRetriesPerRequest: null };
};

export const workerConcurrency = () => {
	const parsed = Number(process.env.WORKER_CONCURRENCY ?? 2);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
};

const queueAttempts = () => {
	const parsed = Number(process.env.QUEUE_ATTEMPTS ?? DEFAULT_ATTEMPTS);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_ATTEMPTS;
};

const jobOptions = () => ({
	attempts: queueAttempts(),
	backoff: { type: "exponential" as const, delay: 2000 },
	removeOnComplete: { age: 3600, count: 1000 },
	removeOnFail: { age: 86400, count: 5000 },
});

let queuePromise: Promise<BullQueue<AnalysisJob>> | undefined;

const getProducerQueue = async () => {
	if (!queuePromise) {
		queuePromise = import("bullmq")
			.then(
				({ Queue }) =>
					new Queue<AnalysisJob>(ANALYSIS_QUEUE, {
						connection: producerConnection(),
					}),
			)
			.catch((error) => {
				// Do not cache a failed import/construct; the next request should retry.
				queuePromise = undefined;
				throw error;
			});
	}

	return queuePromise;
};

const enqueueViaHttp = async (job: AnalysisJob) => {
	const baseUrl = process.env.QUEUE_ENQUEUE_URL;
	const secret = process.env.QUEUE_SECRET;

	if (!baseUrl) {
		throw new ApiError(
			503,
			"QUEUE_NOT_CONFIGURED",
			"The analysis queue is not configured.",
		);
	}

	if (!secret) {
		throw new ApiError(
			503,
			"QUEUE_NOT_CONFIGURED",
			"QUEUE_SECRET is required when QUEUE_ENQUEUE_URL is set.",
		);
	}

	const response = await fetch(`${baseUrl.replace(/\/$/, "")}/enqueue`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-queue-secret": secret,
		},
		body: JSON.stringify(job),
	});

	if (!response.ok) {
		throw new ApiError(
			503,
			"QUEUE_UNAVAILABLE",
			`Enqueue service responded with ${response.status}.`,
		);
	}

	const payload = (await response.json()) as { jobId?: string };
	if (!payload.jobId) {
		throw new ApiError(
			503,
			"QUEUE_UNAVAILABLE",
			"Enqueue service did not return a job id.",
		);
	}

	return payload.jobId;
};

export const enqueueAnalysis = async (job: AnalysisJob) => {
	if (process.env.QUEUE_ENQUEUE_URL) return enqueueViaHttp(job);

	const queue = await getProducerQueue();
	const added = await queue.add(ANALYSIS_QUEUE, job, {
		...jobOptions(),
		jobId: job.analysisId,
	});

	return added.id ?? job.analysisId;
};
