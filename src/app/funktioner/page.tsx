import type { Metadata } from "next";
import { FeaturesPageContent } from "@/components/marketing/FeaturesPageContent";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Funktioner – systemklar",
  description:
    "Automatisk IT-overvågning, besked ved fejl, månedlige rapporter og dansk support. Se hvad systemklar tjekker og hvad I får i portalen.",
  openGraph: {
    title: "Funktioner – systemklar",
    description: "Automatisk overvågning og IT-overblik til danske SMV'er.",
    url: "https://systemklar.dk/funktioner",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

export default function FunktionerPage() {
  return (
    <MarketingShell>
      <FeaturesPageContent />
    </MarketingShell>
  );
}
