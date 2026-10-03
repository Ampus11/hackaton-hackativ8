"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChatBar } from "./chat-bar";
import { UploadTarget } from "./upload-target";

/*
 * The main column of the signed-out home screen.
 *
 * Client for two reasons, and only two. The chat bar needs someone to own what
 * has been typed, and the drop zone needs a router. Neither is application
 * logic: there is no session, no project and no analysis here yet.
 *
 * The column is a flex stack with the prompt centred and the composer pinned to
 * the foot, which is what the layout calls for. The gap between the two is what
 * carries the emptiness -- `justify-center` on the top half would leave the
 * composer floating halfway down a tall window.
 */

export function HomeMain() {
	const router = useRouter();
	const [ask, setAsk] = useState("");

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-14">
				<h1 className="font-display max-w-xl text-center text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-forest sm:text-4xl dark:text-night-text">
					What&rsquo;s cooking, good lookin&rsquo;?
				</h1>

				<UploadTarget
					className="mt-8 w-full max-w-xl sm:mt-10"
					accept=".fasta,.fa,.fna,.ffn,.faa,.frn,.seq"
					// No project exists yet, so there is nowhere for the bytes to go.
					// Sending the visitor to the workspace is the honest outcome --
					// it is where a project can be created and the file imported.
					onFiles={() => router.push("/workspace")}
				/>

				<p className="mt-6 text-xs text-muted dark:text-night-muted">Or you can start by typing</p>
			</div>

			<div className="px-5 pb-6 sm:px-6 sm:pb-8">
				<ChatBar
					variant="filled"
					className="mx-auto w-full max-w-xl"
					value={ask}
					onChange={setAsk}
					label="Ask what to analyse"
				/>
			</div>
		</div>
	);
}