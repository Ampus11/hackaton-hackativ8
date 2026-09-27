/**
 * Single place that resolves the backend API base URL.
 *
 * The frontend only ever talks to this API. It never reaches PostgreSQL, Redis
 * or MinIO; those stay on the VPS behind the tunnel and are reachable only by
 * the backend, which keeps the storage credentials out of the browser.
 */

const configured = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

/** Base URL of the backend API, with no trailing slash. */
export const API_URL = configured.replace(/\/+$/, "");

/**
 * True when the API is not configured. Callers should surface this rather than
 * silently issuing requests to a relative path that will hit the Next.js
 * origin and return HTML instead of JSON.
 */
export const isApiConfigured = API_URL.length > 0;

export type ApiErrorBody = {
	error?: { code?: string; message?: string; details?: unknown };
};

/** The backend wraps every success as `{ data: ... }` and every failure as `{ error: ... }`. */
type ApiEnvelope<T> = { data: T } & ApiErrorBody;

/**
 * Calls the backend API with the session cookie attached.
 *
 * `credentials: "include"` is required: the session lives in an HttpOnly cookie
 * that JavaScript cannot read, so the browser has to be told to send it. The
 * backend answers with `Access-Control-Allow-Origin` for this exact origin.
 */
export const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
	if (!isApiConfigured) {
		throw new Error(
			"NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and point it at the API.",
		);
	}

	const headers = new Headers(init.headers);

	// Never hand-set Content-Type for FormData; the browser has to add the
	// multipart boundary itself or the backend cannot parse the upload.
	if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
		headers.set("content-type", "application/json");
	}

	const response = await fetch(`${API_URL}${path}`, {
		...init,
		headers,
		credentials: "include",
	});

	if (response.status === 204) {
		return undefined as T;
	}

	const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

	if (!response.ok) {
		throw new Error(body.error?.message ?? `API request failed with ${response.status}`);
	}

	return body.data;
};
