import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SciHub Pro - The Scientific GitHub for the Modern Age | Bioinformatics, Cheminformatics & More",
  description: "Unified open-source platform for scientific computing. Bioinformatics, Cheminformatics, Molecular Modelling, Materials Science — all in one place. Free Community Edition + Enterprise features.",
  keywords: ["scientific computing", "bioinformatics", "cheminformatics", "molecular modelling", "research platform", "open source science", "computational biology", "drug discovery", "materials science", "GitHub for science", "SciHub Pro"],
  authors: [{ name: "SciHub Pro Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "SciHub Pro - The Scientific GitHub for the Modern Age",
    description: "One unified platform for all your scientific computing needs. From sequence analysis to drug discovery.",
    siteName: "SciHub Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SciHub Pro - Scientific Computing Platform",
    description: "Democratizing computational research for scientists worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
