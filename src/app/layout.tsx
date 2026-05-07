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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='3' y='3' width='8' height='8' rx='1.5' fill='%230A6EBD'/><rect x='13' y='3' width='8' height='8' rx='1.5' fill='%234FA8E0'/><rect x='3' y='13' width='8' height='8' rx='1.5' fill='%234FA8E0'/><rect x='13' y='13' width='8' height='8' rx='1.5' fill='%230A6EBD'/></svg>",
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
