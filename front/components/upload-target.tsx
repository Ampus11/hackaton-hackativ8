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
 * The border is a dashed `--color-rust`. Rust rather than copper because it is
 * the brief's terracotta and it measures 11.11:1 on the shell, where copper
 * measures 3.60:1 and would sit right on the edge of the 3:1 floor a 2px dashed
 * rule needs. The icon is the same rust, which is why the box reads as one shape
 * rather than a brown frame around a grey glyph.
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
				"rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
				// Drag-over swaps to the ink teal: it is the only signal that the
				// target is live, and terracotta-on-terracotta would be invisible.
				over ? "border-teal-ink bg-teal-ink/5" : "border-rust bg-paper",
				disabled && "pointer-events-none opacity-60",
				"dark:bg-night-raised",
				className,
			)}
		>
			<OpenBoxIcon
				className={cx(
					"mx-auto size-11 transition-colors",
					over ? "text-teal-ink" : "text-rust",
				)}
			/>

			<p className="mt-5 text-sm font-medium text-forest dark:text-night-text">{label}</p>

			{hint ? (
				<p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted dark:text-night-muted">
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