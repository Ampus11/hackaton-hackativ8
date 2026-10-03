import Link from "next/link";

import { AppShell } from "../components/app-shell";
import { GearIcon, HelixIcon, PlusIcon } from "../components/brand";
import { HomeMain } from "../components/home-main";

/**
 * The home screen, signed out.
 *
 * This layout is specified, so it is followed literally: a cream sidebar carrying
 * the logo, the New analysis action, a Recent section, and Settings at the foot;
 * then one centred column in the main area holding the headline, the drop zone,
 * the "Or you can start by typing" line and the composer at the bottom.
 *
 * It stays a Server Component. `HomeMain` is the only client component in the
 * tree, and it is client for two reasons that are both about owning a control's
 * own state rather than about data. So `/` still prerenders, and a visitor paints
 * from the build rather than from a session round trip.
 */

/**
 * The Recent section, signed out.
 *
 * Empty in truth — there is no session, so there is nothing to have been recent.
 * The slot exists anyway because the state it will hold is part of the design,
 * and because "you need to login first" is the honest description of what this
 * app is: usable now, remembered later.
 *
 * The pill is `--color-teal-ink` rather than the brand teal. On cream, `#21A179`
 * carries white text at 3.26:1, which fails AA; `#157F5A` carries it at 4.98:1.
 */
function Recent() {
	return (
		<div>
			<p className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted dark:text-night-muted">
				Recent
			</p>

			<div className="mt-3 px-3">
				<Link
					href="/workspace"
					className="inline-flex items-center rounded-full bg-teal-ink px-4 py-1.5 text-xs font-medium text-cream transition-opacity hover:opacity-90"
				>
					Login
				</Link>
				<p className="mt-2.5 text-[11px] leading-relaxed text-muted dark:text-night-muted">
					You need to login first to save your recent analysis
				</p>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<AppShell
			action={{ label: "New analysis", href: "/workspace", icon: <PlusIcon className="size-4" /> }}
			recent={<Recent />}
			settings={{
				label: "Settings",
				icon: <GearIcon className="size-4" />,
				// Settings is in the design and there is no settings route. It is
				// rendered `aria-disabled` with a note, rather than left as a
				// live-looking control that silently does nothing when pressed.
				disabled: true,
				note: "Settings are not part of this prototype",
			}}
		>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-xs focus:text-cream"
			>
				Skip to content
			</a>

			<HomeMain />

			{/*
			 * The spec's boundary, kept on the page that asks for a file. One line
			 * rather than the section it used to be: this screen is deliberately
			 * sparse, and a wall of caveats under a single input is the wrong
			 * place to make the point. It is repeated beside every result.
			 */}
			<footer className="flex items-center justify-center gap-2 px-5 pb-6 sm:px-6">
				<HelixIcon className="size-3.5 shrink-0 text-teal-ink" showRungs={false} />
				<p className="text-[11px] text-muted dark:text-night-muted">
					Gene Pilot · research and education only, not a diagnostic tool
				</p>
			</footer>
		</AppShell>
	);
}