import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { CookieBanner } from "@/components/ui/CookieBanner";
import CrispChat from "@/components/ui/CrispChat";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Systemklar — Dansk IT-platform",
  description: "IT-support, overblik og AI-værktøjer samlet på én platform til danske virksomheder.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png?v=3", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png?v=3", sizes: "64x64", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${dmSans.variable} h-full antialiased`}>
      <body className={`${dmSans.className} min-h-full flex flex-col font-sans`}>
        {children}
        <CookieBanner />
        <CrispChat />
      </body>
    </html>
  );
}
