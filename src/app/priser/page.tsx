import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Priser – systemklar",
  description:
    "Enkel prissætning fra 499 kr/md. Sammenlign Starter og Pro — ingen binding, opsig når som helst.",
  openGraph: {
    title: "Priser – systemklar",
    description: "Starter fra 499 kr/md. Ingen binding.",
    url: "https://systemklar.dk/priser",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

export default function PriserPage() {
  return (
    <MarketingShell>
      <PricingPageContent />
    </MarketingShell>
  );
}
