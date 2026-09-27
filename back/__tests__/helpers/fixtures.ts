export type GuestProjectPayload = {
	projectId: string;
	sequenceId: string;
	analysisId: string;
	payload: Record<string, any>;
};

const now = () => new Date().toISOString();

/**
 * Builds a nested guest import body with caller-supplied ids, so a test can
 * replay the exact same payload to prove idempotency.
 */
export const buildGuestImport = (options: { withAnalysis?: boolean; withConversations?: boolean } = {}): GuestProjectPayload => {
	const { withAnalysis = true, withConversations = true } = options;

	const projectId = crypto.randomUUID();
	const sequenceId = crypto.randomUUID();
	const analysisId = crypto.randomUUID();
	const createdAt = now();

	const sequences: Record<string, any>[] = [
		{
			id: sequenceId,
			recordId: "probe|1",
			description: "probe record",
			format: "fasta",
			sequenceLength: 12,
			sequenceHash: "abc123",
			originalFilename: "probe.fa",
			createdAt,
			analyses: withAnalysis
				? [
						{
							id: analysisId,
							sequenceId,
							analysisType: "local",
							status: "completed",
							resultJson: { gc_content: 42.5 },
							createdAt,
						},
					]
				: [],
		},
	];

	return {
		projectId,
		sequenceId,
		analysisId,
		payload: {
			version: 1,
			projects: [
				{
					id: projectId,
					name: "Imported project",
					createdAt,
					sequences,
					conversations: withConversations
						? [{ id: crypto.randomUUID(), role: "user", content: "hello", createdAt }]
						: [],
				},
			],
		},
	};
};
