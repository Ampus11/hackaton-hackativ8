const truthy = (value: string | undefined) => value === "true" || value === "1";

/**
 * True on the deployed VPS, where the process has no ambient credentials and
 * every request must authenticate for itself.
 */
export const isHostedRuntime = () =>
	process.env.DEPLOY_RUNTIME === "vps" || process.env.NODE_ENV === "production";

/**
 * Guest/local convenience identity. Never enable this on a public deployment:
 * it hands every caller the same account.
 */
export const isDevIdentityAllowed = () =>
	!isHostedRuntime() || truthy(process.env.ALLOW_DEV_AUTH);

export const useSecureCookies = () => isHostedRuntime();
