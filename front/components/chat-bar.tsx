"use client";

import type { FormEvent } from "react";

import { ArrowUpIcon, PaperclipIcon } from "./brand";
import { cx } from "./primitives";

/*
 * The chat bar, in the two variants the app uses.
 *
 * Presentational only. It holds no state: `value` and `onChange` make it a
 * controlled input, so wherever it is mounted stays the single owner of what has
 * been typed. `onSubmit` is optional -- without it the form will not submit,
 * which is the safe default for a component that has nothing to do with a reply.
 *
 * The `filled` variant is the hero bar at the foot of the home column: the
 * brief's `#6D2700` bar, fully rounded, with a teal circle on the right. Three
 * colours are load-bearing in it and all three were measured against each other
 * rather than picked:
 *
 *   cream placeholder on brown   9.28:1
 *   teal button on the brown bar 3.32:1   (the edge, needs 3:1)
 *   white arrow on the teal      3.26:1   (an icon, needs 3:1)
 *
 * Both of the tight ones pass on the *non-text* floor rather than the 4.5:1 one,
 * which is the right floor for a button edge and an arrow. The white arrow is
 * worth a note because cream on the same teal is 2.80:1 -- it would have been a
 * shape rather than a symbol. The bar uses cream; the arrow inside the button
 * uses white. Different jobs, different floor, different colour.
 */

type ChatBarProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
	variant?: "filled" | "plain";
	disabled?: boolean;
	label: string;
	className?: string;
};

export function ChatBar({
	value,
	onChange,
	onSubmit,
	placeholder = "What are we analyzing today?",
	variant = "plain",
	disabled = false,
	label,
	className,
}: ChatBarProps) {
	const filled = variant === "filled";

	const submit = (event: FormEvent) => {
		event.preventDefault();
		onSubmit?.();
	};

	return (
		<form
			onSubmit={submit}
			className={cx(
				"flex items-center gap-1.5 p-1 transition-colors",
				filled
					? "rounded-full bg-brown text-cream focus-within:ring-2 focus-within:ring-teal focus-within:ring-offset-2 focus-within:ring-offset-cream dark:focus-within:ring-offset-night"
					: "rounded-xl border border-line-strong bg-paper text-forest focus-within:border-teal-ink dark:border-night-line dark:bg-night-raised dark:text-night-text dark:focus-within:border-teal",
				disabled && "opacity-60",
				className,
			)}
		>
			<label className="sr-only" htmlFor={`chat-${variant}`}>
				{label}
			</label>

			<input
				id={`chat-${variant}`}
				type="text"
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				aria-label={label}
				className={cx(
					"min-w-0 flex-1 bg-transparent outline-none",
					filled
						? "px-3.5 text-[11px] text-cream placeholder:text-cream"
						: "px-3 py-2 text-sm text-forest placeholder:text-muted dark:text-night-text dark:placeholder:text-night-muted",
				)}
			/>

			{/*
			 * The paperclip is only on the plain variant. The filled bar sits
			 * directly under a drop zone, so a second way to attach a file on the
			 * same screen is redundancy rather than a shortcut -- and the brief
			 * shows the hero bar carrying the send button alone.
			 */}
			{filled ? null : (
				<button
					type="button"
					disabled={disabled}
					aria-label="Attach a FASTA file"
					className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-shell hover:text-forest dark:text-night-muted dark:hover:bg-cream/10 dark:hover:text-night-text"
				>
					<PaperclipIcon className="size-4" />
				</button>
			)}

			{/*
			 * 24px rather than the brief's 20px. The circle is decorative at that
			 * size but it is also the only submit control on the screen, and 20px
			 * is a small target for a thumb. The bar grew to absorb the difference
			 * rather than the arrow shrinking.
			 */}
			<button
				type="submit"
				disabled={disabled || value.trim().length === 0}
				aria-label="Send"
				className={cx(
					"grid size-6 shrink-0 place-items-center rounded-full transition-opacity disabled:cursor-not-allowed",
					filled
						? "bg-teal text-white hover:opacity-90 disabled:bg-cream/25 disabled:text-cream/60"
						: "bg-forest text-cream hover:bg-forest/90 disabled:bg-shell disabled:text-muted dark:bg-cream dark:text-forest dark:disabled:bg-night dark:disabled:text-night-muted",
				)}
			>
				<ArrowUpIcon className="size-3" />
			</button>
		</form>
	);
}
