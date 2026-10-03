"use client";

import { useRef, useState, type DragEvent } from "react";

import { OpenBoxIcon } from "./brand";
import { cx } from "./primitives";

/*
 * The upload target: the entry point of the whole product.
 *
 * Display plus drag state only. It never reads a file -- it hands the FileList
 * to `onFiles` and forgets it, so whatever stores, validates or parses the bytes
 * stays outside. That also means it works unchanged whether the next step is a
 * presigned PUT, a proxied upload, or nothing wired up yet.
 *
 * The border is a 1.5px dotted `--color-brown`, which is the brief's `#6D2700`.
 * It measures 9.28:1 on the cream surface, well clear of the 3:1 a hairline
 * needs, so nothing had to be corrected here. The box is transparent rather than
 * a shade lighter than the cream: the brief allows either, and transparency is
 * the one that leaves the surface reading as one plane.
 *
 * Sizes are the caller's. The home screen passes the brief's 280x135 and 85% on
 * a phone; nothing here assumes either.
 */

type UploadTargetProps = {
	onFiles?: (files: FileList) => void;
	accept?: string;
	disabled?: boolean;
	label?: React.ReactNode;
	/** Secondary line under the prompt. */
	hint?: React.ReactNode;
	className?: string;
};

export function UploadTarget({
	onFiles,
	accept,
	disabled = false,
	label = "Drop or upload your FASTA file here to get started!",
	hint,
	className,
}: UploadTargetProps) {
	const [over, setOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setOver(false);
		if (disabled) return;
		// `files` rather than a copy: the handler owns it from here.
		if (event.dataTransfer.files.length > 0) onFiles?.(event.dataTransfer.files);
	};

	return (
		<div
			onDragOver={(event) => {
				event.preventDefault();
				if (!disabled) setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={onDrop}
			className={cx(
				"flex flex-col items-center justify-center rounded-[10px] border-[1.5px] border-dotted px-5 text-center transition-colors",
				/*
				 * Drag-over swaps to the ink teal. It is the only signal that the
				 * target is live, and brown-on-brown would be invisible.
				 */
				over ? "border-teal-ink bg-teal-ink/5" : "border-brown",
				disabled && "pointer-events-none opacity-60",
				className,
			)}
		>
			<OpenBoxIcon
				className={cx(
					"shrink-0 transition-colors",
					over ? "text-teal-ink" : "text-brown",
				)}
			/>

			<p className="mt-2.5 max-w-[26ch] text-[11px] font-medium leading-snug text-forest dark:text-night-text">
				{label}
			</p>

			{hint ? (
				<p className="mx-auto mt-1.5 max-w-sm text-[11px] leading-relaxed text-muted dark:text-night-muted">
					{hint}
				</p>
			) : null}

			{/*
			 * The whole box is the drop target but it is not itself focusable --
			 * the input is. Making the div a tab stop as well would put two tab
			 * stops on one control.
			 */}
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				disabled={disabled}
				aria-label="Upload a FASTA file"
				onChange={(event) => {
					if (event.target.files?.length) onFiles?.(event.target.files);
				}}
				className="sr-only"
			/>
		</div>
	);
}
