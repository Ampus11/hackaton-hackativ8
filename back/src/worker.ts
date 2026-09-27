import { app } from "./index";

type WorkerEnv = Record<string, string | undefined>;
type WorkerExecutionContext = unknown;

export default {
	fetch(
		request: Request,
		env: WorkerEnv,
		_executionContext: WorkerExecutionContext,
	) {
		process.env.DEPLOY_RUNTIME = "cloudflare-worker";

		for (const [key, value] of Object.entries(env)) {
			if (typeof value === "string") process.env[key] = value;
		}

		return app.fetch(request);
	},
};
