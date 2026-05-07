import type { Metadata } from "next";
import { MarketingHomeContent } from "@/components/marketing/MarketingHomeContent";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "systemklar – IT-platform til danske SMV'er",
  description:
    "Få styr på IT uden en IT-afdeling. systemklar samler support, systemoverblik og IT-dokumentation ét sted. Prøv gratis.",
  openGraph: {
    title: "systemklar – IT-platform til danske SMV'er",
    description:
      "Få styr på IT uden en IT-afdeling. systemklar samler support, systemoverblik og IT-dokumentation ét sted.",
    url: "https://systemklar.dk",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

export default function Home() {
  return (
    <MarketingShell>
      <MarketingHomeContent />
    </MarketingShell>
  );
}
