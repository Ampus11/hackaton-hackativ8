"use client";

import type { FormEvent } from "react";

import { ArrowUpIcon, PaperclipIcon } from "./brand";
import { cx } from "./primitives";

/*
 * The chat bar, in the two variants from the design system.
 *
 * Presentational only. It holds no state: `value` and `onChange` make it a
 * controlled input, so wherever it is mounted stays the single owner of what has
 * been typed. `onSubmit` is optional -- without it the form will not submit,
 * which is the safe default for a component that has nothing to do with a reply.
 *
 * The `filled` variant is the hero bar at the foot of the main column: `--color-rust`
 * filled, a paperclip on the left and a green up-arrow on the right.
 *
 * Three colours are load-bearing in that bar, and all three were measured
 * against each other rather than picked:
 *
 *   cream placeholder on rust   11.11:1
 *   green button on rust bar     3.97:1   (the edge, needs 3:1)
 *   forest arrow on green        4.16:1   (an icon, needs 3:1)
 *
 * The arrow is forest rather than cream because cream on `#21A179` is only
 * 2.80:1 -- it would have been a shape rather than a symbol. And the button is
 * the *light* teal, not the dark one used elsewhere for borders: a darker teal
 * against rust drops to 2.16:1 and the button stops being findable.
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
				"flex items-center gap-2 border p-1.5 pl-5 transition-colors",
				filled
					? "rounded-full border-rust bg-rust text-cream focus-within:ring-2 focus-within:ring-teal"
					: "rounded-xl border-line-strong bg-paper text-forest focus-within:border-teal-ink dark:border-night-line dark:bg-night dark:text-night-text dark:focus-within:border-teal",
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
					"min-w-0 flex-1 bg-transparent py-2 text-sm outline-none",
					filled
						? "text-cream placeholder:text-cream/70"
						: "text-forest placeholder:text-muted dark:text-night-text dark:placeholder:text-night-muted",
				)}
			/>

			{/*
			 * Icon-only and `aria-labelled` rather than `aria-label`: the label is
			 * already written above as "Attach a file", and repeating it here
			 * would make a screen reader say it twice for one control.
			 */}
			<button
				type="button"
				disabled={disabled}
				aria-label="Attach a FASTA file"
				className={cx(
					"shrink-0 rounded-full p-2 transition-colors",
					filled
						? "text-cream/75 hover:bg-cream/15 hover:text-cream"
						: "text-muted hover:bg-shell hover:text-forest dark:text-night-muted dark:hover:bg-night-raised dark:hover:text-night-text",
				)}
			>
				<PaperclipIcon className="size-4" />
			</button>

			{/* `type="submit"`, so Enter works without any key handling. */}
			<button
				type="submit"
				disabled={disabled || value.trim().length === 0}
				aria-label="Send"
				className={cx(
					"shrink-0 rounded-full p-2 transition-colors disabled:cursor-not-allowed",
					filled
						? "bg-teal text-forest hover:opacity-90 disabled:bg-cream/20 disabled:text-cream/60"
						: "bg-forest text-cream hover:bg-forest/90 disabled:bg-shell disabled:text-muted dark:bg-cream dark:text-forest dark:disabled:bg-night-raised dark:disabled:text-night-muted",
				)}
			>
				<ArrowUpIcon className="size-4" />
			</button>
		</form>
	);
}