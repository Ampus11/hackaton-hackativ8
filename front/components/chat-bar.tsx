"use client";

import type { FormEvent } from "react";

import { PaperclipIcon, SendIcon } from "./brand";
import { cx } from "./primitives";

/*
 * The chat bar, in the two variants from the design system.
 *
 * Presentational only. It holds no state: `value` and `onChange` make it a
 * controlled input, so wherever it is mounted stays the single owner of what has
 * been typed. `onSubmit` is optional -- without it the form will not submit,
 * which is the safe default for a component that has nothing to do with a
 * reply.
 *
 * The "filled" variant is `rust`, not the copper of the palette. Copper fills
 * land at 3.6:1 against cream and 4.2:1 against white, both under the 4.5:1
 * floor for the text that would sit on them. Rust -- which is the same hue as
 * the copper, and already in the palette as the secondary text colour -- clears
 * it at 11.11:1. Copper still does the job it is good at: the dotted edge of the
 * upload target and the icon strokes here.
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
	placeholder = "Ask anything!",
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
				"flex items-center gap-2 rounded-xl border p-1.5 pl-3 transition-colors",
				filled
					? "border-rust bg-rust text-cream focus-within:ring-2 focus-within:ring-teal-deep"
					: "border-line-strong bg-paper text-forest focus-within:border-teal-deep dark:border-night-line dark:bg-night dark:text-night-text dark:focus-within:border-teal",
				disabled && "opacity-60",
				className,
			)}
		>
			<label className="sr-only" htmlFor="chat-bar-input">
				{label}
			</label>

			<input
				id="chat-bar-input"
				type="text"
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				aria-label={label}
				className={cx(
					"min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none",
					filled
						? "text-cream placeholder:text-cream/65"
						: "text-forest placeholder:text-muted dark:text-night-text dark:placeholder:text-night-muted",
				)}
			/>

			<button
				type="button"
				disabled={disabled}
				aria-label="Attach a file"
				className={cx(
					"shrink-0 rounded-lg p-2 transition-colors",
					filled
						? "text-cream/80 hover:bg-cream/15 hover:text-cream"
						: "text-muted hover:bg-shell hover:text-forest dark:text-night-muted dark:hover:bg-night-raised dark:hover:text-night-text",
				)}
			>
				<PaperclipIcon className="size-4" />
			</button>

			{/*
			 * The send control is `type="submit"` so the keyboard Enter key works
			 * for free. Icon-only, so it carries an aria-label rather than text.
			 */}
			<button
				type="submit"
				disabled={disabled || value.trim().length === 0}
				aria-label="Send"
				className={cx(
					"shrink-0 rounded-lg p-2 transition-colors disabled:cursor-not-allowed",
					filled
						? "bg-cream text-rust hover:bg-white disabled:bg-cream/25 disabled:text-rust/50"
						: "bg-forest text-cream hover:bg-forest/90 disabled:bg-shell disabled:text-muted dark:bg-cream dark:text-forest dark:disabled:bg-night-raised dark:disabled:text-night-muted",
				)}
			>
				<SendIcon className="size-4" />
			</button>
		</form>
	);
}