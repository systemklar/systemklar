"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  Flag,
  Hammer,
  MessageSquare,
  Monitor,
  Store,
  Truck,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { HeroStatusMockup } from "@/components/marketing/home/HeroStatusMockup";

const FEATURES = [
  {
    icon: Monitor,
    title: "Automatisk overvågning",
    description: "Vi holder øje med din hjemmeside, SSL, email og domæne — 24/7",
  },
  {
    icon: Bell,
    title: "Besked når noget fejler",
    description: "Få en email med det samme hvis dit system går ned",
  },
  {
    icon: FileText,
    title: "Månedlig IT-rapport",
    description: "En klar rapport over din IT-sundhed — klar til din bestyrelse",
  },
  {
    icon: MessageSquare,
    title: "Support når du har brug",
    description: "Opret en sag og få svar inden for 1 hverdag",
  },
  {
    icon: Zap,
    title: "Enkel opsætning",
    description: "Ingen teknisk viden nødvendig. Vi klarer det hele",
  },
  {
    icon: Flag,
    title: "Dansk support",
    description: "Vi er et dansk team og taler dit sprog",
  },
] as const;

const TRUST_ICONS = [
  { icon: Store, label: "Butik" },
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Hammer, label: "Håndværker" },
  { icon: Building2, label: "Kontor" },
  { icon: Truck, label: "Transport" },
  { icon: Briefcase, label: "Rådgivning" },
] as const;

const STEPS = [
  {
    number: "01",
    title: "Opret din konto",
    description: "Udfyld dine oplysninger — det tager under 10 minutter.",
    illustration: "form",
  },
  {
    number: "02",
    title: "Vi opsætter overvågning",
    description: "Vi forbinder dine systemer og starter automatisk overvågning.",
    illustration: "connect",
  },
  {
    number: "03",
    title: "Du får besked ved problemer",
    description: "Email med det samme hvis noget går galt — ellers ro i maven.",
    illustration: "notify",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    price: "499 kr/md",
    highlight: false,
    features: ["Op til 3 systemer", "E-mail support", "Månedlig rapport"],
  },
  {
    name: "Pro",
    price: "999 kr/md",
    highlight: true,
    features: [
      "Ubegrænsede systemer",
      "Prioriteret support",
      "Ugentlig rapport",
      "API-integrationer",
    ],
  },
] as const;

function StepIllustration({ type }: { type: string }) {
  if (type === "form") {
    return (
      <div className="mx-auto flex h-28 w-full max-w-[200px] flex-col gap-2 rounded-xl border border-[#C8D8E4] bg-white p-4">
        <div className="h-2 w-3/4 rounded bg-[#E0EAF0]" />
        <div className="h-2 w-full rounded bg-[#E0EAF0]" />
        <div className="h-2 w-5/6 rounded bg-[#E0EAF0]" />
        <div className="mt-auto h-8 w-full rounded-lg bg-[#4A7FA5]/15" />
      </div>
    );
  }
  if (type === "connect") {
    return (
      <div className="mx-auto flex h-28 w-full max-w-[200px] items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#4A7FA5] bg-[#EAF1F7]" />
        <div className="h-px w-8 bg-[#C8D8E4]" />
        <div className="h-10 w-10 rounded-full border-2 border-[#C8D8E4] bg-white" />
        <div className="h-px w-8 bg-[#C8D8E4]" />
        <div className="h-10 w-10 rounded-full border-2 border-[#4A7FA5] bg-[#EAF1F7]" />
      </div>
    );
  }
  return (
    <div className="relative mx-auto flex h-28 w-full max-w-[200px] items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C8D8E4] bg-white">
        <Bell className="h-6 w-6 text-[#4A7FA5]" strokeWidth={1.5} />
      </div>
      <span className="absolute right-8 top-6 flex h-4 w-4 items-center justify-center rounded-full bg-[#5A9A6A] text-[9px] font-semibold text-white">
        1
      </span>
    </div>
  );
}

export function MarketingHomeContent() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#F7F4EF] px-6 pb-20 pt-8 md:pb-28 md:pt-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="marketing-hero-enter lg:col-span-3">
            <p className="text-sm font-medium uppercase tracking-wider text-[#4A7FA5]">
              IT-overvågning til danske SMV&apos;er
            </p>
            <h1 className="mt-4 text-4xl font-light leading-[1.15] tracking-tight text-[#1E3448] md:text-5xl lg:text-[3.25rem]">
              Få overblik over din virksomheds IT — uden en IT-afdeling
            </h1>
            <p className="mt-6 max-w-xl text-lg font-normal leading-relaxed text-[#4A6478]">
              Vi overvåger dine systemer automatisk og giver dig besked hvis noget går galt. Enkel
              opsætning, ingen teknisk viden krævet.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#4A7FA5] px-8 text-sm font-medium text-white transition-colors hover:bg-[#3A6F95]"
              >
                Kom i gang gratis
              </Link>
              <Link
                href="#saadan-virker-det"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#C8D8E4] bg-white px-8 text-sm font-medium text-[#4A6478] transition-colors hover:border-[#4A7FA5] hover:text-[#1E3448]"
              >
                Se hvordan det virker
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#7A9AB0]">
              Ingen binding · Opsætning på under 10 minutter
            </p>
          </div>
          <div className="marketing-hero-enter flex justify-center lg:col-span-2" style={{ animationDelay: "120ms" }}>
            <HeroStatusMockup />
          </div>
        </div>
      </section>

      {/* Trust bar */}
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

      {/* Features */}
      <section id="funktioner" className="scroll-mt-24 bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-light tracking-tight text-[#1E3448] md:text-4xl">
              Alt hvad din virksomhed har brug for
            </h2>
          </ScrollReveal>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} staggerMs={index * 100}>
                  <li className="h-full rounded-2xl border border-[#C8D8E4] bg-white p-8 transition-shadow hover:shadow-[0_8px_24px_rgba(30,52,72,0.06)]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E0EAF0] bg-[#EAF1F7] text-[#4A7FA5]">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <h3 className="mt-5 text-lg font-medium text-[#1E3448]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4A6478]">{feature.description}</p>
                  </li>
                </ScrollReveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="saadan-virker-det" className="scroll-mt-24 bg-[#F7F4EF] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-light tracking-tight text-[#1E3448] md:text-4xl">
              Sådan virker det
            </h2>
          </ScrollReveal>
          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <ScrollReveal key={step.number} staggerMs={index * 100}>
                <li className="text-center">
                  <StepIllustration type={step.illustration} />
                  <p className="mt-6 text-5xl font-light text-[#C8D8E4]">{step.number}</p>
                  <h3 className="mt-2 text-xl font-medium text-[#1E3448]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4A6478]">{step.description}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="priser" className="scroll-mt-24 bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-light tracking-tight text-[#1E3448] md:text-4xl">
              Simpel, ærlig prissætning
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {PLANS.map((plan, index) => (
              <ScrollReveal key={plan.name} staggerMs={index * 100}>
                <article
                  className={`flex h-full flex-col rounded-2xl border bg-white p-8 ${
                    plan.highlight
                      ? "border-[#4A7FA5] shadow-[0_0_0_1px_#4A7FA5]"
                      : "border-[#C8D8E4]"
                  }`}
                >
                  <h3 className="text-lg font-medium text-[#1E3448]">{plan.name}</h3>
                  <p className="mt-3 text-3xl font-light text-[#1E3448]">{plan.price}</p>
                  <ul className="mt-6 flex-1 space-y-3 border-t border-[#E0EAF0] pt-6">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#4A6478]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4A7FA5]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      plan.highlight
                        ? "bg-[#4A7FA5] text-white hover:bg-[#3A6F95]"
                        : "border border-[#C8D8E4] text-[#4A6478] hover:bg-[#EAF1F7]"
                    }`}
                  >
                    Kom i gang
                  </Link>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
            <p className="mt-10 text-center text-sm text-[#7A9AB0]">
              Alle priser ex. moms · Ingen binding · Opsig når som helst
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1E3448] px-6 py-20 md:py-24">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-light tracking-tight text-white md:text-4xl">
            Klar til at få styr på din IT?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#7A9AB0]">
            Kom i gang på få minutter — vi hjælper dig med opsætningen.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#4A7FA5] px-10 text-base font-medium text-white transition-colors hover:bg-[#3A6F95]"
          >
            Kom i gang i dag
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
