import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kontakt – systemklar",
  description: "Book en gratis demo eller send os en besked. Vi svarer inden for én hverdag.",
  openGraph: {
    title: "Kontakt – systemklar",
    description: "Book en gratis demo eller send os en besked.",
    url: "https://systemklar.dk/kontakt",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

export default function KontaktLayout({ children }: { children: ReactNode }) {
  return children;
}
