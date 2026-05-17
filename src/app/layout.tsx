import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { CookieBanner } from "@/components/ui/CookieBanner";
import CrispChat from "@/components/ui/CrispChat";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Systemklar — Dansk IT-platform",
  description: "IT-support, overblik og AI-værktøjer samlet på én platform til danske virksomheder.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png?v=4", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: [{ url: "/apple-icon.png?v=4", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${dmSans.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className={`${dmSans.className} min-h-full flex flex-col font-sans`}>
        {children}
        <CookieBanner />
        <CrispChat />
      </body>
    </html>
  );
}
