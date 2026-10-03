import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Instrument_Sans } from "next/font/google";

import "./globals.css";

/*
 * Fonts are self-hosted at build time -- no request leaves the browser for
 * Google. `variable` puts each family on a CSS variable so globals.css can hand
 * them to Tailwind and the whole app inherits them from one place.
 *
 * Fraunces is loaded as a variable font with its weight axis only. It also
 * carries SOFT and WONK, which next/font will not accept a value for in
 * TypeScript, and without them requested they are not in the subset -- so CSS
 * cannot reach them either. Optical sizing is set in globals.css instead, which
 * is the axis that actually matters at heading sizes.
 */
const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-fraunces",
	display: "swap",
});

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
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#FFF6E6" },
		{ media: "(prefers-color-scheme: dark)", color: "#02282B" },
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${fraunces.variable} ${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}