/**
 * Brand marks and the icon set.
 *
 * A Server Component: nothing here has state or handlers, so it renders to
 * markup and costs no client JavaScript.
 *
 * Every icon is a plain 24x24 stroke drawing on `currentColor` at 1.5, so an
 * icon inherits the colour of the text it sits next to and one `<svg>` covers
 * every size via `size-*`. Keeping them in one file rather than pulling a
 * dependency is deliberate: there are eleven of them and they never change.
 */

/* ------------------------------------------------------------------ helix -- */

/**
 * The double helix.
 *
 * Drawn as two mirrored Bézier strands with rungs between them. The strands are
 * the palette's own teal and its darkened sibling -- which is where the "green
 * and teal" of the mark comes from, since the palette carries one green-teal and
 * no second green.
 *
 * `rungs` is separate so a caller can hide the rungs when the mark is small
 * enough that they would only turn into noise.
 */
export const HelixIcon = ({
	className,
	showRungs = true,
}: {
	className?: string;
	showRungs?: boolean;
}) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden
		className={className}
		strokeLinecap="round"
	>
		{/* Strand A: centre, bulges right, centre, bulges left, centre. */}
		<path
			d="M12 3C18 5 18 10 12 12C6 14 6 19 12 21"
			stroke="var(--color-teal)"
			strokeWidth="2"
		/>
		{/* Strand B: the same curve mirrored. */}
		<path
			d="M12 3C6 5 6 10 12 12C18 14 18 19 12 21"
			stroke="var(--color-teal-ink)"
			strokeWidth="2"
		/>
		{showRungs ? (
			<path
				d="M7.8 5.3h8.4M6 7.5h12M7.8 9.8h8.4M7.8 14.3h8.4M6 16.5h12M7.8 18.8h8.4"
				stroke="currentColor"
				strokeWidth="1.25"
				opacity="0.45"
			/>
		) : null}
	</svg>
);

/**
 * The wordmark lockup: the name in the display serif, the category in a small
 * tracked sans. The tracking on the lower line is what separates it from the
 * name -- they are deliberately different treatments of the same two words.
 */
export const Wordmark = ({
	compact = false,
	className,
}: {
	/** Drops the "Research Tool" line, for tight horizontal space. */
	compact?: boolean;
	className?: string;
}) => (
	<span className={className}>
		<span className="wordmark block text-[15px] leading-none text-forest dark:text-night-text">
			Gene Pilot
		</span>
		{compact ? null : (
			<span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.22em] text-muted">
				Research Tool
			</span>
		)}
	</span>
);

/* ------------------------------------------------------------------ icons -- */

type IconProps = { className?: string };

const svg = (className?: string) => ({
	viewBox: "0 0 24 24" as const,
	fill: "none",
	"aria-hidden": true as const,
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	className: className ?? "size-5",
});

export const PlusIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M12 5v14M5 12h14" />
	</svg>
);

export const UploadIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
		<path d="M4 15v3.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V15" />
	</svg>
);

export const PaperclipIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M20 11.5l-7.8 7.8a5 5 0 01-7.1-7.1l8.5-8.5a3.4 3.4 0 014.8 4.8l-8.5 8.5a1.8 1.8 0 01-2.5-2.5l7.8-7.8" />
	</svg>
);

export const SendIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M4.5 12h15M12.5 5l7 7-7 7" />
	</svg>
);

export const ChatIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M20 14.5a2 2 0 01-2 2H8l-4 3.5v-15A2 2 0 016 5h12a2 2 0 012 2z" />
		<path d="M8.5 9.5h7M8.5 12.5h4" />
	</svg>
);

export const FolderIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M3.5 7.5A1.5 1.5 0 015 6h4l2 2.5h8a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 0119 19.5H5A1.5 1.5 0 013.5 18z" />
	</svg>
);

export const SparkIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9z" />
	</svg>
);

export const LogInIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M14 4.5h4A1.5 1.5 0 0119.5 6v12a1.5 1.5 0 01-1.5 1.5h-4" />
		<path d="M10 8l-4 4 4 4M6 12h9" />
	</svg>
);

export const LogOutIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M10 4.5H6A1.5 1.5 0 004.5 6v12A1.5 1.5 0 006 19.5h4" />
		<path d="M14 8l4 4-4 4M18 12H9" />
	</svg>
);

export const SearchIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<circle cx="10.5" cy="10.5" r="6" />
		<path d="M15 15l4.5 4.5" />
	</svg>
);

export const CheckIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M5 12.5l4.5 4.5L19 7.5" />
	</svg>
);

export const AlertIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 8v4.5M12 15.6v.2" />
	</svg>
);

export const InfoIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 11v5M12 7.9v.2" />
	</svg>
);

export const TrashIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0111 4h2a1.5 1.5 0 011.5 1.5V7" />
		<path d="M6.5 7l.8 11.1A1.5 1.5 0 008.8 19.5h6.4a1.5 1.5 0 001.5-1.4L17.5 7" />
	</svg>
);

export const ChevronIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M8 10l4 4 4-4" />
	</svg>
);

export const ArrowUpIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<path d="M12 19.5V5" />
		<path d="M5.5 11.5L12 5l6.5 6.5" />
	</svg>
);

/**
 * The gear, as eight short teeth around a ring. Drawn at 1.5 like the rest of
 * the set rather than at the heavier weight a gear usually gets, because the
 * icons sit next to 12px labels and a thick gear reads as a separate tier.
 */
export const GearIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		<circle cx="12" cy="12" r="3.2" />
		<path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8" />
		<path d="M5.35 5.35l1.98 1.98M16.67 16.67l1.98 1.98M18.65 5.35l-1.98 1.98M7.33 16.67l-1.98 1.98" />
	</svg>
);

/**
 * An open cardboard box, in line art.
 *
 * Four strokes and no fill: the standing back flap, the opening dipping into
 * the box, the tapered body, and the two side flaps folded outward. It is the
 * upload target's only illustration, so it carries the affordance on its own --
 * which is why the flaps are there and not just a cube. A cube would read as
 * "package", and this is the one control on the page that takes a file.
 */
export const OpenBoxIcon = ({ className }: IconProps) => (
	<svg {...svg(className)}>
		{/* the flap standing up behind the box */}
		<path d="M7 8.4V4.2h10v4.2" />
		{/* the opening, dipping down into the box */}
		<path d="M4.6 8.6L12 12.3l7.4-3.7" />
		{/* the body, tapering for perspective */}
		<path d="M4.6 8.6L6.4 20h11.2l1.8-11.4" />
		{/* side flaps folded outward */}
		<path d="M4.6 8.6L2.3 11.4M19.4 8.6l2.3 2.8" />
	</svg>
);