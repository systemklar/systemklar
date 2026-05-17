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
      <section className="bg-[#F7F4EF] px-6 pb-20 pt-8 md:pb-28 md:pt-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="marketing-hero-enter lg:col-span-3">
            <p className="text-sm font-medium uppercase tracking-wider text-[#4A7FA5]">
              IT-support til danske SMV&apos;er
            </p>
            <h1 className="mt-4 text-4xl font-light leading-[1.15] tracking-tight text-[#1E3448] md:text-5xl lg:text-[3.25rem]">
              IT-support, overblik og rapport — alt på ét sted
            </h1>
            <p className="mt-6 max-w-xl text-lg font-normal leading-relaxed text-[#4A6478]">
              Vi holder øje med dine systemer, løser dine IT-problemer og sender dig en månedlig rapport.
              Du behøver ikke vide noget om IT.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={MARKETING_DEMO_HREF}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#4A7FA5] px-8 text-sm font-medium text-white transition-colors hover:bg-[#3A6F95]"
              >
                {MARKETING_DEMO_LABEL}
              </Link>
              <Link
                href="/funktioner"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#C8D8E4] bg-white px-8 text-sm font-medium text-[#4A6478] transition-colors hover:border-[#4A7FA5] hover:text-[#1E3448]"
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

      <section className="border-y border-[#E0EAF0] bg-white px-6 py-12">
        <ScrollReveal className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium text-[#7A9AB0]">Betroet af danske virksomheder</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUST_ICONS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E0EAF0] bg-[#F7F4EF] text-[#7A9AB0]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-xs text-[#7A9AB0]">{label}</span>
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
