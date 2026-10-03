"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { LogInIcon, PlusIcon, Wordmark } from "./brand";
import { cx } from "./primitives";

/*
 * The application shell.
 *
 * The brief describes a framed app rather than a full-bleed page: a charcoal
 * `#1E1E1E` outer screen with a 1360x760 cream container centred in it, rounded
 * at 15px, split into a 150px sidebar and a main area by a single hairline. The
 * frame lives here rather than in the layout because it is a property of *the
 * app*, and both routes share it.
 *
 * Two layouts from one component, because the design system specifies both and
 * the difference is structural rather than cosmetic:
 *
 *   md and up   the framed container: persistent sidebar on the left, main area
 *               scrolling inside the frame. The frame has a fixed height, which
 *               is why the main area scrolls and the page does not -- otherwise
 *               the container would grow past its own frame.
 *   below md    the same container, full-bleed and edge to edge, with a compact
 *               top bar in place of the sidebar. No charcoal margin: on a phone
 *               a decorative frame costs a whole row of the screen.
 *
 * The sidebar does not collapse into a disclosure on mobile. A phone already
 * spends its width on the content, and a menu that has to be opened before
 * anything can be reached costs more than the space it saves. What does not fit
 * in the top bar goes below it, visible without interaction.
 *
 * Presentational throughout: navigation and actions arrive as props, so the
 * shell holds the signed-out, loading and signed-in states without knowing which
 * is which.
 */

export type NavItem = {
	href: string;
	label: string;
	icon: ReactNode;
	active?: boolean;
};

type Action = {
	label: string;
	href?: string;
	onClick?: () => void;
	icon?: ReactNode;
	/**
	 * Present but not wired. `href` and `onClick` are both still supplied --
	 * usually as a no-op -- so the row renders and announces as unavailable
	 * rather than looking live and silently doing nothing when pressed.
	 */
	disabled?: boolean;
	/** Shown on hover, so a disabled row can explain itself. */
	note?: string;
};

type AppShellProps = {
	children: ReactNode;
	nav?: NavItem[];
	/** The action under the logo - "+ New analysis". */
	action?: Action;
	/**
	 * The middle of the sidebar: the Recent section. A slot rather than a prop
	 * because its contents differ by session -- saved analyses when signed in, a
	 * login call and a line explaining why when not.
	 */
	recent?: ReactNode;
	/** The bottom-most row -- Settings in the design. */
	settings?: Action;
	/** Signed out only. Replaced by the account block when there is a user. */
	login?: { label?: string; href: string };
	/** Signed-in identity, rendered in the sidebar footer and under the mobile bar. */
	account?: {
		name: string;
		detail?: string;
		action: { label: string; onClick: () => void; icon: ReactNode };
	};
};

export function AppShell({
	children,
	nav = [],
	action,
	recent,
	settings,
	login,
	account,
}: AppShellProps) {
	return (
		/*
		 * The outer screen. `p-0 md:p-8` means the charcoal is only ever visible
		 * once there is room for a margin to mean something; below `md` the
		 * container runs edge to edge.
		 */
		<div className="flex min-h-full flex-1 items-center justify-center md:p-8">
			{/*
			 * `md:h-[760px]` is the brief's number. The `max-h` clamp is not: on a
			 * short window an unclamped frame would push its own top edge off the
			 * screen and take the sidebar's first item with it. 4rem is exactly
			 * the `md:p-8` above, so the frame never touches the edge.
			 */}
			<div className="flex min-h-full w-full max-w-[1360px] flex-col overflow-hidden bg-cream md:h-[760px] md:max-h-[calc(100dvh-4rem)] md:min-h-0 md:flex-row md:rounded-[15px] dark:bg-night">
				{/* ----------------------------------------------------- sidebar -- */}
				{/*
				 * `hidden md:flex` rather than a toggleable drawer. On desktop this
				 * is always the navigation, and a sidebar that can be collapsed is
				 * one more piece of state to get wrong for no benefit.
				 *
				 * 150px is the brief's width and it is narrow: 12px of padding each
				 * side leaves 126px, which is why the labels below sit at 11px and
				 * not at the 14px the rest of the app uses.
				 */}
				<aside className="hidden w-[150px] shrink-0 flex-col border-r border-line px-3 py-4 md:flex dark:border-night-line">
					{/*
					 * Centred because the brief centres it, and because in a 150px
					 * column a left-aligned logo with a right-aligned category line
					 * reads as two unrelated words rather than one mark.
					 */}
					<Link href="/" className="block px-1 py-2">
						<Wordmark />
					</Link>

					<div className="mt-2 border-t border-line dark:border-night-line" />

					{action ? <ShellAction action={action} className="mt-3" /> : null}

					<div className="mt-3 border-t border-line dark:border-night-line" />

					{nav.length > 0 ? (
						<nav className="mt-3 flex flex-col gap-0.5">
							{nav.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									aria-current={item.active ? "page" : undefined}
									className={cx(
										"flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
										item.active
											? "bg-forest/10 font-medium text-forest dark:bg-cream/10 dark:text-night-text"
											: "text-muted hover:bg-forest/5 hover:text-forest dark:text-night-muted dark:hover:bg-cream/5 dark:hover:text-night-text",
									)}
								>
									{item.icon}
									{item.label}
								</Link>
							))}
						</nav>
					) : null}

					{/* Middle: grows to fill, so the bottom row stays pinned down. */}
					<div className="mt-5 min-h-0 grow overflow-y-auto scrollbar-slim">{recent}</div>

					<div className="mt-auto pt-4">
						{settings ? <ShellRow action={settings} muted /> : null}
						{/* Only add the gap when there is something above it. */}
						{account ? (
							<div className={settings ? "mt-3" : undefined}>
								<Footer account={account} login={login} />
							</div>
						) : login ? (
							<div className={settings ? "mt-3" : undefined}>
								<Footer login={login} />
							</div>
						) : null}
					</div>
				</aside>

				{/* ------------------------------------------------------- main -- */}
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 md:hidden dark:border-night-line">
						<Link href="/" className="min-w-0">
							<Wordmark compact />
						</Link>

						{action ? (
							<ShellAction action={action} size="sm" />
						) : login ? (
							<LoginLink login={login} size="sm" />
						) : null}
					</header>

					{/*
					 * The sidebar footer again, on mobile. The sidebar above is
					 * `hidden` below `md`, so without this there would be no Settings
					 * and no sign-out on a phone -- every action has to exist on each
					 * layout that renders one.
					 */}
					{settings || account || login ? (
						<div className="shrink-0 border-b border-line px-4 py-3 md:hidden dark:border-night-line">
							{settings ? <ShellRow action={settings} muted /> : null}
							{account ? (
								<div className={settings ? "mt-3" : undefined}>
									<Footer account={account} login={login} />
								</div>
							) : login ? (
								<div className={settings ? "mt-3" : undefined}>
									<Footer login={login} />
								</div>
							) : null}
						</div>
					) : null}

					{/*
					 * `id="main"` is the skip-link target. It lives here rather than in
					 * each page so every route gets it, and so the skip link cannot
					 * point at an element a page forgot to add.
					 *
					 * `overflow-y-auto` rather than letting the page scroll: the frame
					 * is a fixed 760px, so the content has to scroll inside it or the
					 * container grows past its own bottom edge.
					 */}
					<main
						id="main"
						className="scrollbar-slim flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
					>
						{children}
					</main>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------- fragments --- */

/*
 * The action under the logo.
 *
 * A menu row, not a filled button. The brief sets it as a small plus beside
 * 10-12px dark teal text with a divider under it, and a filled forest button in
 * a 126px column would be a wall. It is the same pair Button uses in
 * primitives.tsx -- forest on cream, 11.63:1 -- just without the fill.
 */
function ShellAction({
	action,
	size = "md",
	className,
}: {
	action: Action;
	size?: "sm" | "md";
	className?: string;
}) {
	const body = (
		<>
			{action.icon ?? (
				<PlusIcon className={size === "sm" ? "size-3.5 shrink-0" : "size-3.5 shrink-0"} />
			)}
			{action.label}
		</>
	);

	const classes = cx(
		"flex items-center gap-1.5 font-medium text-forest transition-colors hover:text-brown dark:text-night-text dark:hover:text-cream",
		size === "sm"
			? "shrink-0 rounded-lg px-2 py-1.5 text-[12px]"
			: "w-full rounded-lg px-2 py-1.5 text-[11px]",
		// No hover affordance on a row that will not respond to a press.
		action.disabled && "cursor-not-allowed hover:text-forest dark:hover:text-night-text",
		className,
	);

	// A link when it navigates, a button when it acts. The distinction matters
	// for the keyboard: `href="#id"` is focusable and announces as a link, while
	// a button announces as an action.
	return action.href ? (
		<Link href={action.href} className={classes}>
			{body}
		</Link>
	) : (
		<button type="button" onClick={action.disabled ? undefined : action.onClick} className={classes}>
			{body}
		</button>
	);
}

/**
 * A quiet sidebar row — Settings, and anything else that is not navigation.
 *
 * Visually a nav item so the sidebar has one row rhythm, but `muted` so it
 * recedes: it is not a place the reader is meant to go.
 */
function ShellRow({ action, muted = false }: { action: Action; muted?: boolean }) {
	const classes = cx(
		"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
		muted
			? "text-muted hover:bg-forest/5 hover:text-forest dark:text-night-muted dark:hover:bg-cream/5 dark:hover:text-night-text"
			: "text-forest hover:bg-forest/5 dark:text-night-text dark:hover:bg-cream/5",
		// No hover affordance on a row that will not respond to a press.
		action.disabled && "cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent",
	);

	const inner = (
		<>
			{action.icon}
			{action.label}
		</>
	);

	// A disabled row is not a link at all -- it has nowhere to go, and `next/link`
	// will not accept an absent `href`. A `<span>` is also the honest element: no
	// pointer, no tab stop, and the note is announced with it rather than only
	// appearing on hover.
	if (action.disabled) {
		return (
			<span title={action.note} aria-disabled className={classes}>
				{inner}
			</span>
		);
	}

	if (action.href) {
		return (
			<Link href={action.href} className={classes}>
				{inner}
			</Link>
		);
	}

	return (
		<button type="button" onClick={action.onClick} className={classes}>
			{inner}
		</button>
	);
}

function LoginLink({
	login,
	size = "md",
}: {
	login: { label?: string; href: string };
	size?: "sm" | "md";
}) {
	return (
		<Link
			href={login.href}
			className={cx(
				"inline-flex items-center justify-center gap-1.5 rounded-full bg-forest font-medium text-cream transition-opacity hover:opacity-90",
				size === "sm" ? "shrink-0 px-3 py-1.5 text-[11px]" : "w-full px-3 py-1.5 text-[11px]",
			)}
		>
			<LogInIcon className="size-3.5 shrink-0" />
			{login.label ?? "Login"}
		</Link>
	);
}

/** The account block when signed in, the login call when not. */
function Footer({
	account,
	login,
}: {
	account?: AppShellProps["account"];
	login?: AppShellProps["login"];
}) {
	if (account) {
		return (
			<div className="rounded-xl border border-line-strong bg-paper/70 p-2.5 dark:border-night-line dark:bg-night-raised">
				<p className="truncate text-[11px] font-medium text-forest dark:text-night-text">
					{account.name}
				</p>
				{account.detail ? (
					<p className="mt-0.5 truncate text-[11px] text-muted dark:text-night-muted">
						{account.detail}
					</p>
				) : null}
				<button
					type="button"
					onClick={account.action.onClick}
					className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-[11px] font-medium text-muted transition-colors hover:text-brown dark:text-night-muted dark:hover:text-cream"
				>
					{account.action.icon}
					{account.action.label}
				</button>
			</div>
		);
	}

	if (login) return <LoginLink login={login} />;

	return null;
}
