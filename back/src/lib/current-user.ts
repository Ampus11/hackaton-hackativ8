import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { users } from "../db/schema";
import { ApiError } from "./api-error";
import { isDevIdentityAllowed } from "./runtime";
import { readCookie, SESSION_COOKIE, verifySession } from "./session";

/**
 * Resolves the caller from the session cookie alone.
 *
 * This deliberately does not touch the database. The token is HMAC-signed and
 * short-lived, and every ownership check already re-reads the row, so an extra
 * lookup per request would buy nothing.
 */
export const resolveUserId = async (request: Request): Promise<string | null> =>
	verifySession(readCookie(request, SESSION_COOKIE));

const devUserId = async (): Promise<string> => {
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

/**
 * The user id every route acts as, or 401.
 *
 * A real session always wins. The shared dev identity is a local convenience
 * and is reachable only when `ALLOW_DEV_AUTH` is set outside development, so a
 * hosted deployment without authentication fails closed instead of handing
 * every visitor the same account.
 */
export const requireUserId = async (request: Request): Promise<string> => {
	const sessionUserId = await resolveUserId(request);
	if (sessionUserId) {
		return sessionUserId;
	}

	if (!isDevIdentityAllowed()) {
		throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
	}

	return devUserId();
};
