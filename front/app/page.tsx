import Link from "next/link";

import { ALLOWED_EXTENSIONS, MAX_DIRECT_UPLOAD_BYTES, formatBytes } from "../lib/sequence";

/**
 * The landing page is a Server Component on purpose.
 *
 * It used to host the workspace, which meant `/` could only ever show
 * "Checking your session…" until the browser had asked the API who it was. The
 * session is an HttpOnly cookie, so that wait is unavoidable -- but it should
 * not be what a visitor sees first. Rendering the pitch statically means `/`
 * paints from the prerender with no client JavaScript at all, and the workspace
 * at `/workspace` is the only thing that has to wait for the session.
 *
 * The hero shows a real request and a real response rather than a screenshot of
 * the UI. A mock of our own interface is a picture of a promise; the actual
 * numbers out of the pipeline are the proof, and they cost no image request.
 */

/** Counts and length from the worked example in the project spec. */
const SAMPLE = {
	recordId: "MT_NCB_004718",
	organism: "Epinephelus bontoides mitochondrion",
	length: 16641,
	composition: { A: 4890, T: 4670, G: 2610, C: 4471 },
	gcContent: 42.5,
};

const SAMPLE_HEAD = "GATACCAAGGGTTTGGTAGAGCGCTAAAATAAGTAAGCTTAGCCAGGATT";

/**
 * The four nucleotide colours are the convention bioinformatics tools already
 * use (SnapGene, Benchling, the Biopython cookbook): A green, T red, G blue,
 * C amber. Reusing it means a screenshot needs no legend to be read, and it
 * keeps the palette in this app carrying meaning rather than decoration.
 */
const BASES = [
	{ base: "A", full: "Adenine", count: SAMPLE.composition.A, className: "text-emerald-700 dark:text-emerald-400" },
	{ base: "T", full: "Thymine", count: SAMPLE.composition.T, className: "text-red-700 dark:text-red-400" },
	{ base: "G", full: "Guanine", count: SAMPLE.composition.G, className: "text-blue-700 dark:text-blue-400" },
	{ base: "C", full: "Cytosine", count: SAMPLE.composition.C, className: "text-amber-700 dark:text-amber-400" },
] as const;

export default function Home() {
	return (
		<div className="flex min-h-full flex-col">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-xs focus:text-white"
			>
				Skip to content
			</a>

			<SiteHeader />

			<main id="main" className="flex-1">
				{/* ---------------------------------------------------------- hero -- */}
				<section className="border-b border-zinc-200 dark:border-zinc-800">
					<div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
						<p className="font-mono text-xs text-zinc-500">genomics · bioinformatics · research</p>

						<h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
							A bioinformatics assistant that shows its working.
						</h1>

						<p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-300">
							Upload a FASTA file and ask for something specific —{" "}
							<em className="not-italic text-zinc-900 dark:text-zinc-100">
								&quot;find the longest ORF and translate it&quot;
							</em>
							. An agent works out which analyses that needs, runs them
							deterministically, and explains the result in plain language.
						</p>

						<div className="mt-7 flex flex-wrap items-center gap-2.5">
							<Link
								href="/workspace"
								className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
							>
								Open the workspace
							</Link>
							<Link
								href="/workspace"
								className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								Try a sample sequence
							</Link>
						</div>

						<p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
							No account needed to run a tool. Sign-in only adds cloud
							history and project management.
						</p>
					</div>
				</section>

				<div className="mx-auto w-full max-w-3xl px-4">
					{/* --------------------------------------------- worked example -- */}
					<section className="py-14 sm:py-16">
						<h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							What one request actually returns
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
							A 16,641 bp mitochondrial genome, analysed for base composition
							and GC content. These numbers come out of Biopython. The model
							reads them and writes the explanation — it does not produce
							them.
						</p>

						<div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
							{/* Input */}
							<div className="bg-white p-4 dark:bg-zinc-950">
								<p className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
									Input
								</p>
								<pre className="mt-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
									<code>
										<span className="text-zinc-900 dark:text-zinc-100">{`>${SAMPLE.recordId} ${SAMPLE.organism}`}</span>
										{"\n"}
										{SAMPLE_HEAD}
										{"\n"}
										<span className="text-zinc-400">{"..."}</span>
									</code>
								</pre>
								<p className="mt-3 font-mono text-[11px] text-zinc-400">
									16,641 bp · complete genome
								</p>
							</div>

							{/* Output */}
							<div className="bg-white p-4 dark:bg-zinc-950">
								<p className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
									Result
								</p>

								<dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
									{BASES.map((row) => (
										<div key={row.base} className="flex items-baseline justify-between gap-3 py-1.5">
											<dt className="font-mono text-[11px]">
												<span className={row.className}>{row.base}</span>{" "}
												<span className="text-zinc-400">{row.full}</span>
											</dt>
											<dd className="font-mono text-[11px] text-zinc-700 dark:text-zinc-200">
												{row.count.toLocaleString()}
											</dd>
										</div>
									))}
								</dl>

								<div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
									<div className="flex items-baseline justify-between gap-3">
										<dt className="font-mono text-[11px] text-zinc-500">GC content</dt>
										<dd className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
											{SAMPLE.gcContent}%
										</dd>
									</div>
									<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
										<div
											className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200"
											style={{ width: `${SAMPLE.gcContent}%` }}
										/>
									</div>
								</div>
							</div>
						</div>

						<p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
							A 42.5% GC content is unremarkable on its own — vertebrate
							mitochondrial genomes sit near 40%. It becomes useful next to
							what the sequence is, which is what the agent goes and finds.
						</p>
					</section>

					{/* -------------------------------------------------- capability -- */}
					<section className="border-t border-zinc-200 py-14 dark:border-zinc-800 sm:py-16">
						<h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							What it can work out
						</h2>

						<dl className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
							{CAPABILITIES.map((item) => (
								<div
									key={item.term}
									className="grid gap-1 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
								>
									<dt className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
										{item.term}
									</dt>
									<dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
										{item.body}
									</dd>
								</div>
							))}
						</dl>
					</section>

					{/* ---------------------------------------------------- workflow -- */}
					<section className="border-t border-zinc-200 py-14 dark:border-zinc-800 sm:py-16">
						<h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							How a request runs
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
							The agent picks tools from what the task needs, not from keywords
							in the message. That is why one request can chain five analyses
							and the next one stops after two.
						</p>

						<ol className="mt-6 space-y-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
							{STEPS.map((step, index) => (
								<li
									key={step.title}
									className="flex gap-4 bg-white px-4 py-3.5 dark:bg-zinc-950"
								>
									<span className="mt-0.5 shrink-0 font-mono text-[11px] text-zinc-400">
										{String(index + 1).padStart(2, "0")}
									</span>
									<div className="min-w-0">
										<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
											{step.title}
										</p>
										<p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
											{step.body}
										</p>
									</div>
								</li>
							))}
						</ol>

						<p className="mt-4 font-mono text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
							Long-running work is queued, so a request never sits open waiting
							for a tool. You get a status and a notification instead.
						</p>
					</section>

					{/* ----------------------------------------------------- formats -- */}
					<section className="border-t border-zinc-200 py-14 dark:border-zinc-800 sm:py-16">
						<h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							Accepted files
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
							Direct uploads are capped at {formatBytes(MAX_DIRECT_UPLOAD_BYTES)}.
							Extensions are checked in the browser and again by the API.
						</p>
						<ul className="mt-4 flex flex-wrap gap-1.5">
							{ALLOWED_EXTENSIONS.map((extension) => (
								<li
									key={extension}
									className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
								>
									{extension}
								</li>
							))}
						</ul>
					</section>

					{/* ------------------------------------------------------ limits -- */}
					<section className="border-t border-zinc-200 py-14 dark:border-zinc-800 sm:py-16">
						<h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							What this is not
						</h2>
						<ul className="mt-4 max-w-2xl space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
							<li className="flex gap-2.5">
								<span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400" />
								Not a diagnostic tool. Nothing here should be used to guide
								patient care.
							</li>
							<li className="flex gap-2.5">
								<span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400" />
								Not a disease-prediction engine or a treatment recommender.
							</li>
							<li className="flex gap-2.5">
								<span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400" />
								Not a source of biological truth. Every number traces back to a
								deterministic tool or a public database.
							</li>
						</ul>

						<Link
							href="/workspace"
							className="mt-8 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
						>
							Open the workspace
						</Link>
					</section>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}

/* --------------------------------------------------------------- furniture -- */

function SiteHeader() {
	return (
		<header className="border-b border-zinc-200 dark:border-zinc-800">
			<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
				<Link
					href="/"
					className="font-mono text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50"
				>
					genomic-insight
				</Link>
				<nav className="flex items-center gap-1">
					<a
						href="#main"
						className="rounded px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
					>
						Overview
					</a>
					<Link
						href="/workspace"
						className="rounded border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
					>
						Workspace
					</Link>
				</nav>
			</div>
		</header>
	);
}

function SiteFooter() {
	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-800">
			<div className="mx-auto w-full max-w-3xl px-4 py-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p className="font-mono text-[11px] text-zinc-500">
						genomic-insight · research and education
					</p>
					<p className="text-[11px] text-zinc-400">
						Built for the IBM SkillsBuild University Education National
						Hackathon 2026.
					</p>
				</div>
			</div>
		</footer>
	);
}

/* -------------------------------------------------------------------- data -- */

const CAPABILITIES = [
	{
		term: "Base composition",
		body: "Counts of A, T, G and C, plus GC content as (G + C) / total. The quickest thing to run and the first thing worth looking at.",
	},
	{
		term: "Open reading frames",
		body: "Coding regions found across the reading frames, each with its strand, frame, start, stop and length. The forward strand to begin with; all six frames once the reverse complement is in scope.",
	},
	{
		term: "Translation",
		body: "A coding region turned into an amino acid sequence, so a candidate gene can be read before anything is looked up externally.",
	},
	{
		term: "Similarity search",
		body: "BLASTN against public databases, returning accession, identity, E-value and bit score — enough to tell whether a sequence is something already known.",
	},
	{
		term: "Record retrieval",
		body: "An accession from a similarity hit is looked up at its source for organism, gene, CDS, product and feature annotations. Deliberately a separate step, so annotation only happens when a hit justifies it.",
	},
	{
		term: "Interpretation",
		body: "The agent folds the computed numbers and any retrieved record into one explanation, and suggests what would be worth running next.",
	},
] as const;

const STEPS = [
	{
		title: "The request is read for intent",
		body: "The agent works out what is being asked and which analyses it implies. This is a plan, not a script — there is no keyword-to-tool table.",
	},
	{
		title: "Deterministic tools run",
		body: "Sequence parsing, validation, composition, GC content, ORF detection and translation execute as ordinary code. Nothing about the biology is guessed.",
	},
	{
		title: "External evidence is gathered if needed",
		body: "When local analysis is not enough to answer the question, a similarity search runs, then the source record for a promising hit is retrieved.",
	},
	{
		title: "The evidence is explained",
		body: "Computed values and retrieved annotation are combined into a written answer, with the numbers kept distinct from the interpretation.",
	},
] as const;