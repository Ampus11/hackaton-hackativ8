import { afterAll, beforeAll } from "bun:test";

import { db } from "./db";

/**
 * A single shared readiness check: the API must be up and the database must
 * answer before any suite makes assertions, so a dead service is reported once
 * rather than as dozens of confusing failures.
 */
export const assertStackReady = async (url: string) => {
	const response = await fetch(`${url}/health`);

	if (!response.ok) {
		throw new Error(`API health check failed: ${response.status}`);
	}

	const body = (await response.json()) as { database?: string };

	if (body.database !== "connected") {
		throw new Error(`API reports database=${body.database}, expected "connected"`);
	}
};

export const registerLifecycle = () => {
	beforeAll(async () => {
		const rows = await db`select 1 as ok`;

		if (Number(rows[0]!.ok) !== 1) {
			throw new Error("database probe failed");
		}
	});

	afterAll(async () => {
		await db.end();
	});
};
