"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChatBar } from "./chat-bar";
import { UploadTarget } from "./upload-target";

/*
 * The main column of the signed-out home screen.
 *
 * Client for two reasons, and only two. The composer needs someone to own what
 * has been typed, and the drop zone needs a router. Neither is application
 * logic: there is no session, no project and no analysis here yet.
 *
 * The vertical placement is the brief's, not a centring shortcut. It puts the
 * headline 135px below the top of the frame and leaves roughly 400px of empty
 * cream below the composer, so the content is biased upward. `justify-center`
 * would have looked tidier and put the headline halfway down the screen, which
 * is a different page.
 *
 * Widths are the brief's too: a 280px drop zone and a 315px composer, both at
 * 85% below `md` where a fixed 280px would be a third of a phone.
 */

export function HomeMain() {
	const router = useRouter();
	const [ask, setAsk] = useState("");

	return (
		<div className="flex flex-1 flex-col items-center px-5 pb-10 pt-9 md:pt-[135px]">
			<h1 className="text-center text-[18px] font-semibold leading-snug text-balance text-forest dark:text-night-text">
				What&rsquo;s cooking, good lookin&rsquo;?
			</h1>

			<UploadTarget
				className="mt-5 h-[135px] w-[85%] max-w-[280px]"
				accept=".fasta,.fa,.fna,.ffn,.faa,.frn,.seq"
				// No project exists yet, so there is nowhere for the bytes to go.
				// Sending the visitor to the workspace is the honest outcome -- it
				// is where a project can be created and the file imported.
				onFiles={() => router.push("/workspace")}
			/>

			<p className="mt-2 text-[11px] text-forest dark:text-night-text">
				Or you can start by typing
			</p>

			<ChatBar
				variant="filled"
				className="mt-2 w-[85%] max-w-[315px]"
				value={ask}
				onChange={setAsk}
				label="Ask what to analyse"
			/>
		</div>
	);
}
