import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Priser – systemklar",
  description: "Enkel pris fra 499 kr/md. Ingen binding. Vælg den plan der passer til din virksomhed.",
  openGraph: {
    title: "Priser – systemklar",
    description: "Enkel pris fra 499 kr/md. Ingen binding.",
    url: "https://systemklar.dk/priser",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

export default function PriserLayout({ children }: { children: ReactNode }) {
  return children;
}
