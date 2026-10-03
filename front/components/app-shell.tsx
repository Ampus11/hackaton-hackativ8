"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { HelixIcon, LogInIcon, PlusIcon, Wordmark } from "./brand";
import { cx } from "./primitives";

/*
 * The application shell.
 *
 * Two layouts from one component, because the design system specifies both and
 * the difference is structural rather than cosmetic:
 *
 *   lg and up   a persistent sidebar on the brand cream, content on the lighter
 *               shell colour. The sidebar is the navigation; the page scrolls.
 *   below lg    a single column with a sticky top bar, and the identity block
 *               directly under it.
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

type Action = { label: string; href?: string; onClick?: () => void; icon?: ReactNode };

type AppShellProps = {
	children: ReactNode;
	nav?: NavItem[];
	/** The primary action — "New Analysis" in the design. */
	action?: Action;
	/** Signed out only. Replaced by the account block when there is a user. */
	login?: { label?: string; href: string };
	/** Signed-in identity, rendered in the sidebar footer and under the mobile bar. */
	account?: { name: string; detail?: string; action: { label: string; onClick: () => void; icon: ReactNode } };
};

export function AppShell({ children, nav = [], action, login, account }: AppShellProps) {
	return (
		<div className="flex min-h-full flex-1 flex-col lg:flex-row">
			{/* ------------------------------------------------------- sidebar -- */}
			{/*
			 * `hidden lg:flex` rather than a toggleable drawer. On desktop this is
			 * always the navigation, and a sidebar that can be collapsed is one
			 * more piece of state to get wrong for no benefit.
			 */}
			<aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-cream px-4 py-5 lg:flex dark:border-night-line dark:bg-night">
				<Link href="/" className="flex items-center gap-2.5 px-1">
					<HelixIcon className="size-7 shrink-0 text-forest dark:text-night-text" />
					<Wordmark />
				</Link>

				{action ? <ShellAction action={action} className="mt-6" /> : null}

				{nav.length > 0 ? (
					<nav className="mt-6 flex flex-col gap-0.5">
						{nav.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								aria-current={item.active ? "page" : undefined}
								className={cx(
									"flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
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

				<div className="mt-auto pt-6">
					<Footer account={account} login={login} />
				</div>
			</aside>

			{/* ---------------------------------------------------------- main -- */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 border-b border-line bg-shell/90 backdrop-blur-sm lg:hidden dark:border-night-line dark:bg-night/90">
					<div className="flex items-center justify-between gap-3 px-4 py-3">
						<Link href="/" className="flex min-w-0 items-center gap-2">
							<HelixIcon className="size-6 shrink-0 text-forest dark:text-night-text" />
							<Wordmark compact />
						</Link>

						{action ? <ShellAction action={action} size="sm" /> : login ? <LoginLink login={login} size="sm" /> : null}
					</div>
				</header>

				{/*
				 * The footer again, on mobile. The sidebar above is `hidden` below
				 * `lg`, so without this there would be no sign-out on a phone --
				 * every action has to exist on each layout that renders one.
				 */}
				{account || login ? (
					<div className="border-b border-line px-4 py-4 lg:hidden dark:border-night-line">
						<Footer account={account} login={login} />
					</div>
				) : null}

				{/*
				 * `id="main"` is the skip-link target. It lives here rather than in
				 * each page so every route gets it, and so the skip link cannot
				 * point at an element that a page forgot to add.
				 */}
				<main id="main" className="min-w-0 flex-1">
					{children}
				</main>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------- fragments --- */

/*
 * One action, rendered either way.
 *
 * The filled style is `forest` on `cream` text — the same pair Button uses in
 * primitives.tsx, at 11.63:1. A filled teal button would land at 3.7:1, under
 * the floor for body copy, so teal never becomes a surface here either.
 */
function ShellAction({ action, size = "md", className }: { action: Action; size?: "sm" | "md"; className?: string }) {
	const body = (
		<>
			{action.icon ?? <PlusIcon className={size === "sm" ? "size-3.5" : "size-4"} />}
			{action.label}
		</>
	);

	const classes = cx(
		"inline-flex items-center justify-center gap-1.5 rounded-lg bg-forest font-medium text-cream transition-colors hover:bg-forest/90",
		size === "sm" ? "shrink-0 px-3 py-1.5 text-xs" : "w-full px-3 py-2.5 text-sm",
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
		<button type="button" onClick={action.onClick} className={classes}>
			{body}
		</button>
	);
}

function LoginLink({ login, size = "md" }: { login: { label?: string; href: string }; size?: "sm" | "md" }) {
	return (
		<Link
			href={login.href}
			className={cx(
				"inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-paper font-medium text-forest transition-colors hover:bg-shell dark:border-night-line dark:bg-night-raised dark:text-night-text dark:hover:bg-cream/10",
				size === "sm" ? "shrink-0 px-3 py-1.5 text-xs" : "w-full px-3 py-2.5 text-sm",
			)}
		>
			<LogInIcon className={size === "sm" ? "size-3.5" : "size-4"} />
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
			<div className="rounded-xl border border-line-strong bg-paper/70 p-3 dark:border-night-line dark:bg-night-raised">
				<p className="truncate text-xs font-medium text-forest dark:text-night-text">{account.name}</p>
				{account.detail ? (
					<p className="mt-0.5 truncate text-[11px] text-muted dark:text-night-muted">{account.detail}</p>
				) : null}
				<button
					type="button"
					onClick={account.action.onClick}
					className="mt-2.5 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-muted transition-colors hover:text-rust dark:text-night-muted dark:hover:text-cream"
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