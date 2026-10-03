import Link from "next/link";

import { AppShell, type NavItem } from "../components/app-shell";
import {
	AlertIcon,
	CheckIcon,
	FolderIcon,
	HelixIcon,
	PlusIcon,
	SearchIcon,
	SparkIcon,
} from "../components/brand";
import { UploadTarget } from "../components/upload-target";
import { ALLOWED_EXTENSIONS, MAX_DIRECT_UPLOAD_BYTES, formatBytes } from "../lib/sequence";

/**
 * The landing page is a Server Component on purpose.
 *
 * It used to host the workspace, which meant `/` could only ever show
 * "Checking your session..." until the browser had asked the API who it was. The
 * session is an HttpOnly cookie, so that wait is unavoidable -- but it should not
 * be what a visitor sees first. Rendering the pitch statically means `/` paints
 * from the prerender with no client JavaScript at all.
 *
 * The hero shows a real request and a real response rather than a mockup of our
 * own interface. A mock of our own UI is a picture of a promise; the actual
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
 * C amber. They are deliberately not the brand palette -- brand teal is green
 * too, and a chart where "the brand colour" and "adenine" are the same green
 * would be unreadable.
 */
const BASES = [
	{ base: "A", full: "Adenine", count: SAMPLE.composition.A, className: "text-emerald-700 dark:text-emerald-400" },
	{ base: "T", full: "Thymine", count: SAMPLE.composition.T, className: "text-red-700 dark:text-red-400" },
	{ base: "G", full: "Guanine", count: SAMPLE.composition.G, className: "text-blue-700 dark:text-blue-400" },
	{ base: "C", full: "Cytosine", count: SAMPLE.composition.C, className: "text-amber-700 dark:text-amber-400" },
] as const;

const NAV: NavItem[] = [
	{ href: "/#capabilities", label: "Capabilities", icon: <SearchIcon className="size-4" /> },
	{ href: "/#flow", label: "How it runs", icon: <SparkIcon className="size-4" /> },
	{ href: "/#formats", label: "File formats", icon: <FolderIcon className="size-4" /> },
];

export default function Home() {
	return (
		<AppShell
			nav={NAV}
			action={{ label: "New Analysis", href: "/workspace", icon: <PlusIcon className="size-4" /> }}
			login={{ label: "Login", href: "/workspace" }}
		>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-xs focus:text-cream"
			>
				Skip to content
			</a>

			{/* ---------------------------------------------------------- hero -- */}
			<section className="border-b border-line dark:border-night-line">
				<div className="mx-auto w-full max-w-4xl px-4 py-14 sm:py-20">
					<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
						genomics · bioinformatics · research
					</p>

					<h1 className="font-display mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-forest sm:text-5xl dark:text-night-text">
						A bioinformatics assistant that shows its working.
					</h1>

					<p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted dark:text-night-muted">
						Upload a FASTA file and ask for something specific —{" "}
						<span className="font-display text-[15px] italic text-forest dark:text-night-text">
							&quot;find the longest ORF and translate it&quot;
						</span>
						. An agent works out which analyses that needs, runs them
						deterministically, and explains the result in plain language.
					</p>

					<div className="mt-8 flex flex-wrap items-center gap-2.5">
						<Link
							href="/workspace"
							className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest/90"
						>
							<PlusIcon className="size-4" />
							New Analysis
						</Link>
						<Link
							href="#capabilities"
							className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-paper px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-shell dark:border-night-line dark:bg-night-raised dark:text-night-text dark:hover:bg-cream/10"
						>
							What it can do
						</Link>
					</div>

					<p className="mt-4 text-xs text-muted dark:text-night-muted">
						No account needed to run a tool. Sign-in only adds cloud history and
						project management.
					</p>
				</div>
			</section>

			<div className="mx-auto w-full max-w-4xl px-4">
				{/* ------------------------------------------------- upload entry -- */}
				{/*
				 * The design system's hero component: the upload target, centred,
				 * with the cheeky header. Shown as a specimen rather than wired up,
				 * because there is no project to attach a file to until someone is
				 * signed in -- so it is `pointer-events-none` and carries a caption
				 * that says what it is. The working version is one click away.
				 */}
				<section className="py-14 sm:py-16">
					<div className="mx-auto max-w-md">
						<div aria-hidden className="pointer-events-none select-none">
							<UploadTarget
								disabled={false}
								heading={
									<h2 className="font-display text-2xl font-semibold leading-tight text-balance text-forest dark:text-night-text">
										What’s cooking, good lookin’?
									</h2>
								}
								label="Drop a FASTA file here"
								hint={".fasta, .fa and .fna up to 100 MB, or paste the sequence straight in."}
								className="[&_input]:hidden"
							/>
						</div>

						<div className="mt-5 text-center">
							<Link
								href="/workspace"
								className="inline-flex items-center justify-center rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest/90"
							>
								Open the workspace
							</Link>
							<p className="mt-2.5 text-[11px] text-muted dark:text-night-muted">
								The live uploader is in the workspace.
							</p>
						</div>
					</div>
				</section>

				{/* --------------------------------------------- worked example -- */}
				<section className="border-t border-line py-14 dark:border-night-line sm:py-16">
					<Eyebrow>What one request returns</Eyebrow>
					<h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-forest sm:text-3xl dark:text-night-text">
						Numbers first, explanation second.
					</h2>
					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted dark:text-night-muted">
						A 16,641 bp mitochondrial genome, analysed for base composition and
						GC content. These numbers come out of Biopython. The model reads them
						and writes the explanation — it does not produce them.
					</p>

					<div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 dark:border-night-line dark:bg-night-line">
						<div className="bg-paper p-4 dark:bg-night-raised">
							<Label>Input</Label>
							<pre className="mt-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-muted dark:text-night-muted">
								<code>
									<span className="text-forest dark:text-night-text">{`>${SAMPLE.recordId} ${SAMPLE.organism}`}</span>
									{"\n"}
									{SAMPLE_HEAD}
									{"\n"}
									<span className="text-muted/70">{"..."}</span>
								</code>
							</pre>
							<p className="mt-3 font-mono text-[11px] text-muted dark:text-night-muted">
								16,641 bp · complete genome
							</p>
						</div>

						<div className="bg-paper p-4 dark:bg-night-raised">
							<Label>Result</Label>

							<dl className="mt-3 divide-y divide-line dark:divide-night-line">
								{BASES.map((row) => (
									<div key={row.base} className="flex items-baseline justify-between gap-3 py-1.5">
										<dt className="font-mono text-[11px]">
											<span className={row.className}>{row.base}</span>{" "}
											<span className="text-muted dark:text-night-muted">{row.full}</span>
										</dt>
										<dd className="font-mono text-[11px] text-forest dark:text-night-text">
											{row.count.toLocaleString()}
										</dd>
									</div>
								))}
							</dl>

							<div className="mt-3 border-t border-line pt-3 dark:border-night-line">
								<div className="flex items-baseline justify-between gap-3">
									<dt className="font-mono text-[11px] text-muted dark:text-night-muted">
										GC content
									</dt>
									<dd className="font-mono text-sm font-semibold text-forest dark:text-night-text">
										{SAMPLE.gcContent}%
									</dd>
								</div>
								<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line dark:bg-night">
									<div
										className="h-full rounded-full bg-teal-deep"
										style={{ width: `${SAMPLE.gcContent}%` }}
									/>
								</div>
							</div>
						</div>
					</div>

					<p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted dark:text-night-muted">
						42.5% is unremarkable on its own — vertebrate mitochondrial genomes sit
						near 40%. It becomes useful next to what the sequence is, which is what
						the agent goes and finds.
					</p>
				</section>

				{/* -------------------------------------------------- capabilities -- */}
				<section
					id="capabilities"
					className="scroll-mt-16 border-t border-line py-14 dark:border-night-line sm:py-16"
				>
					<Eyebrow>Capability</Eyebrow>
					<h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-forest sm:text-3xl dark:text-night-text">
						What it can work out
					</h2>

					<dl className="mt-7 divide-y divide-line border-y border-line dark:divide-night-line dark:border-night-line">
						{CAPABILITIES.map((item) => (
							<div
								key={item.term}
								className="grid gap-1.5 py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8"
							>
								<dt className="font-mono text-xs font-medium text-forest dark:text-night-text">
									{item.term}
								</dt>
								<dd className="text-sm leading-relaxed text-muted dark:text-night-muted">
									{item.body}
								</dd>
							</div>
						))}
					</dl>
				</section>

				{/* ---------------------------------------------------- workflow -- */}
				<section
					id="flow"
					className="scroll-mt-16 border-t border-line py-14 dark:border-night-line sm:py-16"
				>
					<Eyebrow>The flow</Eyebrow>
					<h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-forest sm:text-3xl dark:text-night-text">
						How a request runs
					</h2>
					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted dark:text-night-muted">
						The agent picks tools from what the task needs, not from keywords in the
						message. That is why one request can chain five analyses and the next
						one stops after two.
					</p>

					<ol className="mt-7 space-y-px overflow-hidden rounded-xl border border-line bg-line dark:border-night-line dark:bg-night-line">
						{STEPS.map((step, index) => (
							<li key={step.title} className="flex gap-4 bg-paper px-4 py-3.5 dark:bg-night-raised">
								<span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="min-w-0">
									<p className="text-sm font-medium text-forest dark:text-night-text">
										{step.title}
									</p>
									<p className="mt-1 text-sm leading-relaxed text-muted dark:text-night-muted">
										{step.body}
									</p>
								</div>
							</li>
						))}
					</ol>

					<p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-muted dark:text-night-muted">
						Long-running work is queued, so a request never sits open waiting for a
						tool. You get a status and a notification instead.
					</p>
				</section>

				{/* ----------------------------------------------------- formats -- */}
				<section
					id="formats"
					className="scroll-mt-16 border-t border-line py-14 dark:border-night-line sm:py-16"
				>
					<Eyebrow>Input</Eyebrow>
					<h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-forest sm:text-3xl dark:text-night-text">
						Accepted files
					</h2>
					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted dark:text-night-muted">
						Direct uploads are capped at {formatBytes(MAX_DIRECT_UPLOAD_BYTES)}.
						Extensions are checked in the browser and again by the API.
					</p>
					<ul className="mt-4 flex flex-wrap gap-1.5">
						{ALLOWED_EXTENSIONS.map((extension) => (
							<li
								key={extension}
								className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-muted dark:border-night-line dark:bg-night-raised dark:text-night-muted"
							>
								{extension}
							</li>
						))}
					</ul>
				</section>

				{/* ------------------------------------------------------ limits -- */}
				<section className="border-t border-line py-14 dark:border-night-line sm:py-16">
					<Eyebrow>Boundaries</Eyebrow>
					<h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-forest sm:text-3xl dark:text-night-text">
						What this is not
					</h2>
					<ul className="mt-5 max-w-2xl space-y-2.5 text-sm leading-relaxed text-muted dark:text-night-muted">
						{[
							"Not a diagnostic tool. Nothing here should be used to guide patient care.",
							"Not a disease-prediction engine or a treatment recommender.",
							"Not a source of biological truth. Every number traces back to a deterministic tool or a public database.",
						].map((line) => (
							<li key={line} className="flex gap-2.5">
								<AlertIcon className="mt-0.5 size-4 shrink-0 text-copper" />
								{line}
							</li>
						))}
					</ul>

					<div className="mt-8 flex flex-wrap items-center gap-2.5">
						<Link
							href="/workspace"
							className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest/90"
						>
							<HelixIcon className="size-4" showRungs={false} />
							Open the workspace
						</Link>
						<p className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-night-muted">
							<CheckIcon className="size-3.5 text-teal-deep dark:text-teal" />
							Research and education only
						</p>
					</div>
				</section>
			</div>

			<SiteFooter />
		</AppShell>
	);
}

/* ---------------------------------------------------------------- furniture -- */

/** The tracked sans eyebrow above every section heading. */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
	<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-teal-deep dark:text-teal">
		{children}
	</p>
);

const Label = ({ children }: { children: React.ReactNode }) => (
	<p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{children}</p>
);

function SiteFooter() {
	return (
		<footer className="border-t border-line dark:border-night-line">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
				<p className="font-mono text-[11px] text-muted">gene-pilot · research and education</p>
				<p className="text-[11px] text-muted dark:text-night-muted">
					IBM SkillsBuild University Education National Hackathon 2026
				</p>
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
		body: "Computed values and retrieved annotation are combined into one written answer, with the numbers kept distinct from the interpretation.",
	},
] as const;