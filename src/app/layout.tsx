import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Ribbon } from "@/components/site/Ribbon";
import { SiteFooter } from "@/components/site/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIHPC Advanced - Scientific Computing Platform | Bioinformatics, Cheminformatics & More",
  description:
    "Unified scientific computing platform. Bioinformatics, cheminformatics, molecular modelling and materials science behind one polyglot microservices architecture. Public preview mirror of the private AIHPC-Advanced repository.",
  keywords: [
    "scientific computing",
    "bioinformatics",
    "cheminformatics",
    "molecular modelling",
    "research platform",
    "open source science",
    "computational biology",
    "drug discovery",
    "materials science",
    "AIHPC",
    "AETHEL",
    "SciHub Pro",
  ],
  authors: [{ name: "AIHPC Advanced Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "AIHPC Advanced - Scientific Computing Platform",
    description:
      "Public preview mirror of the AIHPC Advanced scientific computing platform.",
    siteName: "AIHPC Advanced",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIHPC Advanced - Scientific Computing Platform",
    description:
      "Public preview mirror of the AIHPC Advanced scientific computing platform.",
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
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Ribbon />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
