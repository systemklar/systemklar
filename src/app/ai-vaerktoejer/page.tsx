import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingSubpageHero } from "@/components/marketing/MarketingSubpageHero";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const tools = [
  {
    icon: "🧠",
    title: "AI-assistent med indsigt i jeres egne data",
    badge: "Plus",
    description:
      "Få konkrete svar baseret på jeres systemer og sager — ikke generiske råd — så I kan handle hurtigere.",
  },
  {
    icon: "📄",
    title: "AI Tilbudsgenerator",
    badge: "Alle planer",
    description:
      "Byg tilbud ud fra jeres ydelser og priser automatisk og send dem professionelt på få øjeblikke.",
  },
  {
    icon: "📊",
    title: "AI IT-rapportgenerator",
    badge: "Standard & Plus",
    description:
      "Automatiseret hjælp til IT-rapporter baseret på jeres sagshistorik og aktivitet på platformen.",
  },
];

const comingSoon = [
  "Microsoft 365-integration — udvidet overblik og automatisering omkring M365.",
  "Dinero-integration — hurtigere håndtering af økonomi-relaterede workflows.",
];

export default function AiVaerktoejerPage() {
  return (
    <MarketingShell>
      <main className="bg-white">
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pb-16 md:pt-24">
          <MarketingSubpageHero
            badge="AI-værktøjer"
            title="AI der arbejder med jer — ikke ved siden af"
            description={
              <>
                <strong className="font-semibold text-[#0A0A0A]">AI Tilbudsgenerator</strong> er inkluderet i alle
                abonnementer. Øvrige funktioner herunder kan afhænge af plan — se også{" "}
                <Link href="/priser" className="font-semibold text-[#2563EB] underline-offset-2 hover:underline">
                  prisoversigt
                </Link>
                .
              </>
            }
          >
            <Link
              href="/book-demo"
              className="cta-pulse inline-flex rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Book demo
            </Link>
          </MarketingSubpageHero>
        </section>

        <section className="border-t border-gray-100 bg-[#F7F7F5] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {tools.map((tool, index) => (
                <ScrollReveal key={tool.title} staggerMs={index * 100} className="h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
                    <span className="text-5xl leading-none" aria-hidden>
                      {tool.icon}
                    </span>
                    <h2 className="mt-6 text-xl font-semibold text-[#2563EB]">{tool.title}</h2>
                    <p className="mt-3 inline-block w-fit rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                      {tool.badge}
                    </p>
                    <p className="mt-5 leading-relaxed text-[#6B6B6B]">{tool.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <ScrollReveal staggerMs={0}>
            <div className="rounded-2xl border border-gray-100 bg-[#F7F7F5] px-8 py-10 md:px-12">
              <h3 className="text-xl font-bold text-[#0A0A0A]">Kommende</h3>
              <p className="mt-2 text-[#6B6B6B]">
                Vi udvider løbende — her er ting, vi arbejder på at koble på platformen:
              </p>
              <ul className="mt-6 space-y-4">
                {comingSoon.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-gray-200 pb-4 text-[#0A0A0A] last:border-0 last:pb-0">
                    <span className="shrink-0 text-[#2563EB]" aria-hidden>
                      →
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerMs={80} className="mt-10">
            <div className="rounded-2xl border border-gray-100 bg-white px-8 py-10 md:px-12">
              <h3 className="text-xl font-bold text-[#0A0A0A]">Vigtigt at vide</h3>
              <p className="mt-3 max-w-2xl text-[#6B6B6B]">
                AI-værktøjerne aktiveres i kundeportalen — log ind eller book en demo for at se dem i aktion.
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </MarketingShell>
  );
}
