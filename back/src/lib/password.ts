import { decodeBase64Url, encodeBase64Url } from "./base64url";

/**
 * Password hashing built on Web Crypto only.
 *
 * Workers runtime has no native Node bindings, so bcrypt/argon2 native builds
 * are not an option, and `bcryptjs` would block the isolate on a pure-JS KDF.
 * `crypto.subtle` PBKDF2 is native in workerd, Bun and Node, so the same code
 * path runs on every deploy target.
 */
const ALGORITHM = "PBKDF2";
const HASH = "SHA-512";
const KEY_BYTES = 64;
const SALT_BYTES = 16;
const SCHEME = "pbkdf2-sha512";

/** OWASP's floor for PBKDF2-HMAC-SHA-512. */
const DEFAULT_ITERATIONS = 210_000;
const MIN_ITERATIONS = 1_000;
const MAX_ITERATIONS = 2_000_000;

const iterations = () => {
	const configured = Number(process.env.PBKDF2_ITERATIONS ?? DEFAULT_ITERATIONS);

	if (!Number.isInteger(configured)) {
		return DEFAULT_ITERATIONS;
	}

	return Math.min(MAX_ITERATIONS, Math.max(MIN_ITERATIONS, configured));
};

const derive = async (
	password: string,
	salt: Uint8Array<ArrayBuffer>,
	rounds: number,
) => {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		ALGORITHM,
		false,
		["deriveBits"],
	);

	return new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: ALGORITHM, hash: HASH, salt, iterations: rounds },
			key,
			KEY_BYTES * 8,
		),
	);
};

/** Length-safe constant-time comparison; length itself is not secret. */
const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
	if (left.length !== right.length) {
		return false;
	}

	let difference = 0;
	for (let index = 0; index < left.length; index += 1) {
		difference |= left[index] ^ right[index];
	}
	return difference === 0;
};

export const hashPassword = async (password: string): Promise<string> => {
	const rounds = iterations();
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await derive(password, salt, rounds);

	return [
		SCHEME,
		String(rounds),
		encodeBase64Url(salt),
		encodeBase64Url(hash),
	].join("$");
};

const parseStored = (stored: string) => {
	const parts = stored.split("$");
	if (parts.length !== 4 || parts[0] !== SCHEME) {
		return null;
	}

	const rounds = Number(parts[1]);
	if (!Number.isInteger(rounds) || rounds < MIN_ITERATIONS) {
		return null;
	}

	try {
		return {
			rounds,
			salt: decodeBase64Url(parts[2]),
			hash: decodeBase64Url(parts[3]),
		};
	} catch {
		return null;
	}
};

export const verifyPassword = async (
	password: string,
	stored: string,
): Promise<boolean> => {
	const parsed = parseStored(stored);
	if (!parsed) {
		return false;
	}

	const candidate = await derive(password, parsed.salt, parsed.rounds);
	return constantTimeEqual(candidate, parsed.hash);
};

/**
 * A fixed, valid hash of an unguessable value.
 *
 * Login runs this when the email is unknown so that "no such user" costs the
 * same wall-clock time as a real verification. Without it, response latency
 * alone enumerates registered addresses.
 */
let decoyHash: Promise<string> | undefined;

export const dummyPasswordHash = (): Promise<string> => {
	decoyHash ??= hashPassword(crypto.randomUUID());
	return decoyHash;
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;
