import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

import { createApp } from "./app";

type WorkerEnv = Record<string, string | undefined>;
type WorkerExecutionContext = unknown;

// `.compile()` precompiles the handlers at build time. Without it Elysia composes
// them per request with `new Function()`, which the Workers runtime rejects.
const app = createApp({ adapter: CloudflareAdapter }).compile();

export default {
	fetch(
		request: Request,
		env: WorkerEnv,
		executionContext: WorkerExecutionContext,
	) {
		process.env.DEPLOY_RUNTIME = "cloudflare-worker";

		for (const [key, value] of Object.entries(env)) {
			if (typeof value === "string") process.env[key] = value;
		}

		// Bindings are not used: every value we need is a plain string var, which
		// nodejs_compat already exposes on process.env and which we just copied.
		return app.fetch(request);
	},
};
