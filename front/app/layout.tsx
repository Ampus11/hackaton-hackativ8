import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";

import "./globals.css";

/*
 * Fonts are self-hosted at build time -- no request leaves the browser for
 * Google. `variable` puts each family on a CSS variable so globals.css can hand
 * them to Tailwind and the whole app inherits them from one place.
 *
 * Two families, not three. The brief asks for "a modern clean sans-serif font
 * similar to Inter, Poppins or Montserrat" and lists no serif anywhere in its
 * type hierarchy, so the serif that used to carry the headings and the wordmark
 * is gone. Instrument Sans is the whole voice; Geist Mono is there only because
 * a sequence, a count and an accession are read character by character, and a
 * proportional sans makes them harder to line up.
 */
const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-instrument-sans",
	display: "swap",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://gene-pilot.pages.dev"),
	title: {
		default: "Gene Pilot — Research Tool",
		template: "%s · Gene Pilot",
	},
	description:
		"Upload a FASTA file and ask for a specific analysis. An agent works out which tools the request needs, runs them deterministically, and explains the result in plain language. For research and education.",
	applicationName: "Gene Pilot",
	keywords: [
		"bioinformatics",
		"genomics",
		"FASTA",
		"GenBank",
		"GC content",
		"ORF",
		"BLAST",
		"sequence analysis",
	],
	authors: [{ name: "Gene Pilot" }],
	openGraph: {
		type: "website",
		title: "Gene Pilot — Research Tool",
		description:
			"An agentic bioinformatics assistant that shows its working. Deterministic computation first, explanation second.",
		siteName: "Gene Pilot",
	},
	twitter: {
		card: "summary_large_image",
		title: "Gene Pilot — Research Tool",
		description:
			"An agentic bioinformatics assistant that shows its working. Deterministic computation first, explanation second.",
	},
	robots: { index: true, follow: true },
};

export const viewport: Viewport = {
	// The charcoal outer screen, not the cream container -- it is what a phone
	// browser paints before the page arrives.
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#1E1E1E" },
		{ media: "(prefers-color-scheme: dark)", color: "#02282B" },
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}