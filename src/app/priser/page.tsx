"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle, ChevronDown, MessageCircle, Shield } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";

type Plan = {
  name: string;
  monthly: string;
  yearly: string;
  fits: string;
  features: string[];
  highlight?: boolean;
  cta: { label: string; href: string };
  buttonStyle: "primary" | "outline";
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthly: "499 kr/md",
    yearly: "415 kr/md",
    fits: "Passer til: 1-5 ansatte · solo og micro-virksomheder",
    features: [
      "Overblik over dine IT-systemer",
      "Support & sager med realtids chat",
      "Sikker kodebank til passwords",
      "Månedlig IT-rapport",
      "Op til 3 teammedlemmer",
    ],
    cta: { label: "Kom i gang", href: "/kontakt" },
    buttonStyle: "outline",
  },
  {
    name: "Plus",
    monthly: "1.299 kr/md",
    yearly: "1.082 kr/md",
    fits: "Passer til: 6-15 ansatte · vækstvirksomheder",
    features: [
      "Alt i Starter",
      "Op til 15 teammedlemmer",
      "AI-assistent til IT-spørgsmål",
      "Tilbud på 2 minutter med AI",
      "Prioriteret support",
    ],
    highlight: true,
    cta: { label: "Kom i gang", href: "/kontakt" },
    buttonStyle: "primary",
  },
  {
    name: "Pro",
    monthly: "2.499 kr/md",
    yearly: "2.082 kr/md",
    fits: "Passer til: 16+ ansatte · etablerede virksomheder",
    features: [
      "Alt i Plus",
      "Ubegrænset teammedlemmer",
      "Dedikeret kontaktperson",
      "SLA-garanti på svartid",
      "Custom IT-rapport skabelon",
    ],
    cta: { label: "Kontakt os", href: "/kontakt" },
    buttonStyle: "outline",
  },
];

const reassurance = [
  {
    icon: Calendar,
    title: "Ingen binding",
    desc: "Opsig når som helst. Opsigelse træder i kraft ved udgangen af indeværende betalingsperiode.",
  },
  {
    icon: MessageCircle,
    title: "Gratis onboarding",
    desc: "Vi sætter det hele op for jer. En kort gennemgang og I er klar – typisk på under 30 minutter.",
  },
  {
    icon: Shield,
    title: "Dansk support",
    desc: "Skriv til os direkte i platformen. Vi svarer inden for én hverdag – på dansk.",
  },
];

const faq: Array<{ q: string; a: string }> = [
  {
    q: "Kan jeg skifte plan?",
    a: "Ja, du kan opgradere eller nedgradere når som helst. Ændringer træder i kraft med det samme.",
  },
  {
    q: "Er der binding?",
    a: "Nej. Du betaler måned for måned og kan opsige når du vil. Ingen lange kontrakter.",
  },
  {
    q: "Hvad sker der når vi oprettes?",
    a: "Vi kontakter jer inden for én hverdag og sætter platformen op til jer. Du behøver ikke gøre noget selv.",
  },
  {
    q: "Kan hele teamet bruge det?",
    a: "Ja. Du kan invitere kolleger direkte fra platformen. De får deres eget login under jeres virksomhed.",
  },
  {
    q: "Hvad hvis vi har brug for hjælp?",
    a: "Skriv direkte i platformen eller send en email til kontakt@systemklar.dk. Vi svarer hurtigt.",
  },
];

export default function PriserPage() {
  const [yearly, setYearly] = useState(false);
  const [priceFading, setPriceFading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPriceFading(true), 0);
    const restoreTimer = window.setTimeout(() => setPriceFading(false), 300);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(restoreTimer);
    };
  }, [yearly]);

  return (
    <MarketingShell>
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-32 pt-40">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              Priser
            </p>
            <AnimatedSection direction="up">
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Enkel pris. Ingen overraskelser.
              </h1>
            </AnimatedSection>
            <AnimatedSection direction="up" delay={100}>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Vælg den plan der passer til jer – og skift når behovet ændrer sig.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex min-h-8 items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!yearly ? "text-[#0D1F2D]" : "text-[#4A8CB5]"}`}>Månedlig</span>
              <button
                onClick={() => setYearly(!yearly)}
                aria-label={yearly ? "Skift til månedlig" : "Skift til årlig"}
                className={`relative h-6 w-12 rounded-full transition-colors duration-200 ${
                  yearly ? "bg-sky-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    yearly ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${yearly ? "text-[#0D1F2D]" : "text-[#4A8CB5]"}`}>Årlig</span>
              <span
                className={`min-w-[110px] rounded-full bg-green-100 px-2 py-0.5 text-center text-xs font-semibold text-green-700 transition-opacity duration-200 ${
                  yearly ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                Spar 2 måneder
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan, index) => (
                <AnimatedSection
                  key={plan.name}
                  direction="up"
                  delay={(index * 100) as 0 | 100 | 200 | 300}
                >
                  <div className="relative h-full">
                    {plan.highlight ? (
                      <div
                        className="pointer-events-none absolute -inset-0.5 animate-pulse rounded-[18px] bg-sky-400/20 blur-sm"
                        aria-hidden
                      />
                    ) : null}
                    <article
                      className={`relative flex h-full flex-col rounded-2xl bg-white p-8 ${
                        plan.highlight
                          ? "border-2 border-sky-600 shadow-xl"
                          : "border border-sky-200 shadow-sm"
                      }`}
                    >
                      {plan.highlight ? (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          Mest populær
                        </span>
                      ) : null}
                      <h3 className="text-xl font-semibold uppercase tracking-wide text-[#0D1F2D]">{plan.name}</h3>
                      <p
                        className={`mt-2 text-3xl font-bold text-[#0D1F2D] transition-opacity duration-200 ${
                          priceFading ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        {yearly ? plan.yearly : plan.monthly}
                      </p>
                      {yearly ? <p className="mt-1 text-xs text-[#4A8CB5]">faktureres årligt</p> : null}
                      <p className="mt-3 text-xs text-[#4A8CB5]">{plan.fits}</p>
                      <ul className="mt-6 space-y-3 text-sm text-[#2C4A5E]">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan.cta.href}
                        className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 font-semibold transition-colors ${
                          plan.buttonStyle === "primary"
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : "border border-sky-200 text-sky-700 hover:bg-sky-50"
                        }`}
                      >
                        {plan.cta.label}
                      </Link>
                    </article>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <AnimatedSection direction="up">
              <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
                Prøv uden risiko
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
                Vi gør det enkelt at komme i gang – og endnu nemmere at stoppe igen, hvis det ikke passer.
              </p>
            </AnimatedSection>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {reassurance.map(({ icon: Icon, title, desc }, i) => (
                <AnimatedSection
                  key={title}
                  direction="up"
                  delay={(i * 100) as 0 | 100 | 200}
                >
                  <div className="h-full rounded-2xl border border-sky-100 bg-[#F0F7FF] p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                      <Icon className="h-6 w-6 text-sky-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0D1F2D]">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#2C4A5E]">{desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-20">
          <div className="mx-auto max-w-2xl px-6">
            <AnimatedSection direction="up">
              <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
                Ofte stillede spørgsmål
              </h2>
            </AnimatedSection>
            <div className="mt-10 space-y-3">
              {faq.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <AnimatedSection
                    key={item.q}
                    direction="up"
                    delay={(Math.min(i, 3) * 100) as 0 | 100 | 200 | 300}
                  >
                    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                      >
                        <span className="font-semibold text-[#0D1F2D]">{item.q}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-sky-600 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : "rotate-0"
                          }`}
                          aria-hidden
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-6 pb-5 text-sm leading-relaxed text-[#2C4A5E]">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}
