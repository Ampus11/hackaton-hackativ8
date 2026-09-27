export const API_URL =
	process.env.TEST_API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}`;

export const PASSWORD = "Correct-Horse-9";

export type Json = Record<string, any>;

export type Result = {
	status: number;
	body: Json;
	headers: Headers;
};

/**
 * A cookie jar plus request helper. Each test file creates its own client, so
 * sessions never leak between files while still working within one.
 */
export const createClient = () => {
	let cookie: string | undefined;

	const request = async (
		path: string,
		init: RequestInit & { auth?: boolean } = {},
	): Promise<Result> => {
		const headers = new Headers(init.headers);

		// FormData must keep the boundary that fetch generates, so only default
		// the content type for the JSON bodies.
		if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
			headers.set("content-type", "application/json");
		}

		if (init.auth !== false && cookie) {
			headers.set("cookie", cookie);
		}

		const response = await fetch(`${API_URL}${path}`, { ...init, headers });
		const setCookie = response.headers.get("set-cookie");

		if (setCookie?.startsWith("gia_session=")) {
			cookie = setCookie.split(";")[0]!;
		}

		const text = await response.text();
		let body: Json | undefined;

		try {
			body = text ? JSON.parse(text) : undefined;
		} catch {
			body = { raw: text };
		}

		return { status: response.status, body: body as Json, headers: response.headers };
	};

	const json = (method: string, path: string, payload: unknown, auth = true) =>
		request(path, {
			method,
			body: JSON.stringify(payload),
			auth,
		});

	const post = (path: string, payload: unknown, auth = true) => json("POST", path, payload, auth);

	const createUser = async (label = "user") => {
		const email = `${label}-${crypto.randomUUID().slice(0, 8)}@vps.test`;
		const result = await post("/auth/register", { email, password: PASSWORD, name: `${label} probe` }, false);

		if (result.status !== 201) {
			throw new Error(`register failed: ${result.status} ${JSON.stringify(result.body)}`);
		}

		return { email, id: result.body.data.user.id as string };
	};

	const createProject = async (name = "Test project") => {
		const result = await post("/projects", { name });

		if (result.status !== 201) {
			throw new Error(`create project failed: ${result.status} ${JSON.stringify(result.body)}`);
		}

		return result.body.data.id as string;
	};

	const createSequence = async (projectId: string, overrides: Json = {}) =>
		post(`/projects/${projectId}/sequences`, {
			format: "fasta",
			recordId: "probe|1",
			sequenceLength: 12,
			sequenceHash: "hash-probe",
			...overrides,
		});

	const upload = async (projectId: string, filename: string, body: string) => {
		const form = new FormData();

		form.set("projectId", projectId);
		form.set("filename", filename);
		form.set("file", new File([body], filename, { type: "text/plain" }));

		return request("/storage/upload", { method: "POST", body: form });
	};

	return {
		request,
		post,
		json,
		createUser,
		createProject,
		createSequence,
		upload,
		get cookie() {
			return cookie;
		},
		set cookie(value: string | undefined) {
			cookie = value;
		},
		clearSession() {
			cookie = undefined;
		},
	};
};

export type Client = ReturnType<typeof createClient>;
