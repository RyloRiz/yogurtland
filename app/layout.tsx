import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// Poppins is the real Yogurtland site's own UI font (alongside a licensed
// Gotham we can't use), so it's the authentic choice for a brand-matched reskin.
const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Flavor Finder",
	description: "Find every nearby Yogurtland that has all the flavors you want, right now.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}>
			<head>
				<Script defer src="https://u.ops.rizwaan.dev/ping.js" data-website-id="630a4449-a316-4de6-9677-5518141a54d5"></Script>
				<Script defer src="https://u.ops.rizwaan.dev/recorder.js" data-website-id="630a4449-a316-4de6-9677-5518141a54d5"></Script>
			</head>
			<body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
		</html>
	);
}
