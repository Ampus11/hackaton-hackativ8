import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { users } from "../db/schema";
import { ApiError } from "./api-error";

const hostedRuntime = () =>
	process.env.VERCEL === "1" ||
	process.env.DEPLOY_RUNTIME === "cloudflare-worker" ||
	process.env.NODE_ENV === "production";

const devIdentityAllowed = () =>
	!hostedRuntime() || process.env.ALLOW_DEV_AUTH === "true";

export const requireUserId = async (): Promise<string> => {
	if (!devIdentityAllowed()) {
		throw new ApiError(
			401,
			"AUTH_NOT_IMPLEMENTED",
			"Authentication is required for this environment.",
		);
	}

	const email = (process.env.DEV_USER_EMAIL ?? "developer@local.test")
		.trim()
		.toLowerCase();

	const [user] = await getDb()
		.insert(users)
		.values({
			email,
			name: "Local Developer",
			passwordHash: `disabled:${crypto.randomUUID()}`,
		})
		.onConflictDoUpdate({
			target: users.email,
			set: { updatedAt: new Date() },
		})
		.returning({ id: users.id });

	return user.id;
};
