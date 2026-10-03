import Link from "next/link";

import { AppShell } from "../components/app-shell";
import { GearIcon, HelixIcon, PlusIcon } from "../components/brand";
import { HomeMain } from "../components/home-main";

/**
 * The home screen, signed out.
 *
 * This layout is specified down to the pixel, so it is followed literally: a
 * 1360x760 cream container centred in the charcoal outer screen, a 150px
 * sidebar holding the logo, "+ New analysis", the Recent section and Settings,
 * then one column in the main area with the headline, the drop zone, the "Or you
 * can start by typing" line and the composer.
 *
 * It stays a Server Component. `HomeMain` is the only client component in the
 * tree, and it is client for two reasons that are both about owning a control's
 * own state rather than about data. So `/` still prerenders and a visitor paints
 * from the build rather than from a session round trip.
 */

/**
 * The Recent section, signed out.
 *
 * Empty in truth -- there is no session, so there is nothing to have been
 * recent. The slot exists anyway because the state it will hold is part of the
 * design, and because "you need to login first" is the honest description of
 * what this app is: usable now, remembered later.
 *
 * Order is the brief's: heading, then the sentence explaining why, then the
 * button. Putting the explanation above the pill is unusual and it is right here
 * -- the sentence is the reason the button is there, and in a 126px column
 * reading the button first would make it look like the whole feature.
 *
 * The pill is forest rather than teal. `#023436` with cream text measures
 * 11.63:1, and the brief's own hex for it.
 */
function Recent() {
	return (
		<div>
			<p className="px-2 text-[11px] font-semibold text-forest dark:text-night-text">
				Recent
			</p>

			<p className="mt-2 px-2 text-[11px] leading-relaxed text-muted dark:text-night-muted">
				You need to login first to save your recent analysis
			</p>

			<div className="mt-2.5 px-2">
				<Link
					href="/workspace"
					className="flex h-[25px] w-[120px] items-center justify-center rounded-full bg-forest text-[11px] font-medium text-cream transition-opacity hover:opacity-90 dark:bg-cream dark:text-forest"
				>
					Login
				</Link>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<AppShell
			action={{ label: "New analysis", href: "/workspace", icon: <PlusIcon className="size-3.5 shrink-0" /> }}
			recent={<Recent />}
			settings={{
				label: "Settings",
				icon: <GearIcon className="size-3.5 shrink-0" />,
				// Settings is in the design and there is no settings route. It is
				// rendered `aria-disabled` with a note, rather than left as a
				// live-looking control that silently swallows the click.
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

			{/* `min-h-full` so the footer below can be pushed to the bottom of the
			 * frame by `mt-auto`, rather than sitting under the composer. */}
			<div className="flex min-h-full flex-col">
				<HomeMain />

				{/*
				 * The spec's boundary, kept on the page that asks for a file. One line
				 * in the empty cream the brief leaves below the composer, rather than
				 * the section it used to be: this screen is deliberately sparse and a
				 * wall of caveats under a single input is the wrong place to make the
				 * point. It is repeated beside every result.
				 */}
				<footer className="mt-auto flex items-center justify-center gap-1.5 px-5 pb-5">
					<HelixIcon className="size-3 shrink-0 text-teal-ink" showRungs={false} />
					<p className="text-[11px] text-muted dark:text-night-muted">
						Gene Pilot · research and education only, not a diagnostic tool
					</p>
				</footer>
			</div>
		</AppShell>
	);
}
