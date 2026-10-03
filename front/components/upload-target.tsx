"use client";

import { useRef, useState, type DragEvent } from "react";

import { UploadIcon } from "./brand";
import { cx } from "./primitives";

/*
 * The upload target: the entry point of the whole product.
 *
 * Display plus drag state only. It never reads a file -- it hands the FileList to
 * `onFiles` and forgets it, so whatever actually stores, validates or parses the
 * bytes stays outside. That also means it works unchanged whether the next step
 * is a presigned PUT, a proxied upload or nothing at all yet.
 *
 * The border is `dashed` copper because copper is the palette's accent for
 * *edges*: at 3.6:1 on the shell it clears the 3:1 floor that a 2px dashed rule
 * needs, and it is the one place the warm secondary gets to be loud. The fill is
 * `paper`, never copper -- see the note in chat-bar.tsx on why copper is not a
 * surface.
 */

type UploadTargetProps = {
	onFiles?: (files: FileList) => void;
	accept?: string;
	disabled?: boolean;
	/** Rendered above the prompt, e.g. the cheeky mobile header. */
	heading?: React.ReactNode;
	hint?: React.ReactNode;
	label?: string;
	className?: string;
};

export function UploadTarget({
	onFiles,
	accept,
	disabled = false,
	heading,
	hint,
	label = "Upload a FASTA file",
	className,
}: UploadTargetProps) {
	const [over, setOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setOver(false);
		if (disabled) return;
		// `files` rather than a FileList copy: the handler owns it from here.
		if (event.dataTransfer.files.length > 0) onFiles?.(event.dataTransfer.files);
	};

	return (
		<div className={cx("flex flex-col items-center gap-4", className)}>
			{heading ? <div className="text-center">{heading}</div> : null}

			{/*
			 * The whole box is the drop target, but it is not itself focusable --
			 * the input inside is. Duplicating it would put two tab stops on one
			 * control.
			 */}
			<div
				onDragOver={(event) => {
					event.preventDefault();
					if (!disabled) setOver(true);
				}}
				onDragLeave={() => setOver(false)}
				onDrop={onDrop}
				className={cx(
					"w-full rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
					over
						? "border-teal-deep bg-teal-deep/5"
						: "border-copper/70 bg-paper dark:border-copper/60 dark:bg-night-raised",
					disabled && "pointer-events-none opacity-60",
				)}
			>
				<span
					className={cx(
						"mx-auto flex size-12 items-center justify-center rounded-xl transition-colors",
						over ? "bg-teal-deep/10 text-teal-deep" : "bg-shell text-copper dark:bg-night",
					)}
				>
					<UploadIcon className="size-5" />
				</span>

				<p className="mt-4 text-sm font-medium text-forest dark:text-night-text">{label}</p>

				{hint ? (
					<p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted dark:text-night-muted">
						{hint}
					</p>
				) : null}

				<input
					ref={inputRef}
					type="file"
					accept={accept}
					disabled={disabled}
					onChange={(event) => {
						if (event.target.files?.length) onFiles?.(event.target.files);
					}}
					className="sr-only"
				/>
			</div>
		</div>
	);
}