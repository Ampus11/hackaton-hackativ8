import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

/*
 * Self-hosted by next/font at build time — no request leaves the browser for
 * Google. `variable` puts the family on a CSS variable instead of a class, so
 * `globals.css` can hand it to Tailwind's `--font-sans` / `--font-mono` and the
 * whole app inherits it from one place.
 */
const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
	display: "swap",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://genomic-insight.pages.dev"),
	title: {
		default: "Genomic Insight",
		template: "%s · Genomic Insight",
	},
	description:
		"A workspace for nucleotide data. Import FASTA or GenBank files, queue GC content and open reading frame analyses, and read the results as charts and tables.",
	applicationName: "Genomic Insight",
	keywords: ["genomics", "FASTA", "GenBank", "GC content", "ORF", "bioinformatics"],
	authors: [{ name: "Genomic Insight" }],
	openGraph: {
		type: "website",
		title: "Genomic Insight",
		description:
			"Import sequences, queue analyses, and read the results as charts and tables.",
		siteName: "Genomic Insight",
	},
	twitter: {
		card: "summary_large_image",
		title: "Genomic Insight",
		description:
			"Import sequences, queue analyses, and read the results as charts and tables.",
	},
	robots: { index: true, follow: true },
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
		{ media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}
