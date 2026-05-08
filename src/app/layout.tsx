import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/ui/CookieBanner";
import CrispChat from "@/components/ui/CrispChat";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Systemklar — Dansk IT-platform",
  description: "IT-support, overblik og AI-værktøjer samlet på én platform til danske virksomheder.",
  icons: {
    icon: [{ url: "/icon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <CookieBanner />
        <CrispChat />
      </body>
    </html>
  );
}
