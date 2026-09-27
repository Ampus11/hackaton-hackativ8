export class ApiError extends Error {
	constructor(
		readonly statusCode: number,
		readonly code: string,
		message: string,
		readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export const errorBody = (
	code: string,
	message: string,
	details?: Record<string, unknown>,
) => ({
	error: {
		code,
		message,
		...(details ? { details } : {}),
	},
});
