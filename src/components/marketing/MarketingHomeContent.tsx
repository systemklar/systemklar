"use client";

import Link from "next/link";
import {
  Briefcase,
  Building2,
  Hammer,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { MarketingCtaSection } from "@/components/marketing/MarketingCtaSection";
import { MarketingCtaNote } from "@/components/marketing/MarketingCtaNote";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { HeroStatusMockup } from "@/components/marketing/home/HeroStatusMockup";
import { HomeTeaserSections } from "@/components/marketing/home/HomeTeaserSections";
import { PortalPreviewShowcase } from "@/components/marketing/home/PortalPreviewShowcase";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

const TRUST_ICONS = [
  { icon: Store, label: "Butik" },
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Hammer, label: "Håndværker" },
  { icon: Building2, label: "Kontor" },
  { icon: Truck, label: "Transport" },
  { icon: Briefcase, label: "Rådgivning" },
] as const;

export function MarketingHomeContent() {
  return (
    <>
      <section className="bg-white px-6 pb-20 pt-8 md:pb-28 md:pt-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="marketing-hero-enter lg:col-span-3">
            <p className="marketing-section-label">IT-support til danske SMV&apos;er</p>
            <h1 className="marketing-hero-title mt-4 leading-[1.15]">
              IT-support, overblik og rapport — alt på ét sted
            </h1>
            <p className="mt-6 max-w-xl text-lg font-normal leading-relaxed text-[#2A4868]">
              Vi holder øje med dine systemer, løser dine IT-problemer og sender dig en månedlig rapport.
              Du behøver ikke vide noget om IT.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={MARKETING_DEMO_HREF}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#2952A3] px-8 text-sm font-medium text-white transition-colors hover:bg-[#1E4490]"
              >
                {MARKETING_DEMO_LABEL}
              </Link>
              <Link
                href="/funktioner"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#CBD5E8] bg-white px-8 text-sm font-medium text-[#2A4868] transition-colors hover:border-[#2952A3] hover:text-[#0A1628]"
              >
                Se funktioner
              </Link>
            </div>
            <MarketingCtaNote className="mt-6 text-left" />
          </div>
          <div
            className="marketing-hero-enter flex justify-center lg:col-span-2 motion-reduce:opacity-100"
            style={{ animationDelay: "120ms" }}
          >
            <HeroStatusMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-[#E4EAF5] bg-white px-6 py-12">
        <ScrollReveal className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium text-[#6A82A8]">Betroet af danske virksomheder</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUST_ICONS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E4EAF5] bg-[#F2F5FA] text-[#6A82A8]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-xs text-[#6A82A8]">{label}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </section>

      <PortalPreviewShowcase />

      <HomeTeaserSections />

      <MarketingCtaSection
        heading="Klar til en uforpligtende snak?"
        subtext="Fortæl os om din virksomhed — vi viser dig, hvordan systemklar kan hjælpe."
        buttonLabel={MARKETING_DEMO_LABEL}
        buttonHref={MARKETING_DEMO_HREF}
        showNote
      />
    </>
  );
}
