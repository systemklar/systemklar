import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingSubpageHero } from "@/components/marketing/MarketingSubpageHero";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const features = [
  {
    icon: "🏠",
    title: "Kundeportal med dashboard",
    description: "Et samlet dashboard i kundeportalen med overblik over status, hændelser og aktivitet.",
  },
  {
    icon: "📡",
    title: "IT-systemovervågning",
    description: "Tilføj jeres systemer og følg status live — sundhed og ændringer samlet ét sted.",
  },
  {
    icon: "💬",
    title: "Support & sager",
    description: "Opret og følg sager og chat i realtid med Systemklar, så I altid ved, hvad der sker.",
  },
  {
    icon: "📑",
    title: "IT-rapporter",
    description: "Månedlige rapporter fra jeres IT-leverandør med drift, trends og konkrete anbefalinger.",
  },
  {
    icon: "🧠",
    title: "AI-assistent",
    description: "Stil spørgsmål om jeres systemer og sager — få hjælp til hurtige afklaringer i hverdagen.",
  },
  {
    icon: "📄",
    title: "AI Tilbudsgenerator",
    description: "Generér professionelle tilbud på sekunder med jeres ydelser, priser og kundens behov.",
  },
  {
    icon: "🔐",
    title: "Sikker kodebank",
    description: "Gem logins og følsomme oplysninger sikkert, så teamet nemt finder det, der skal bruges.",
  },
  {
    icon: "🔔",
    title: "Realtids notifikationer",
    description: "Hold jer opdaterede med øjeblikkelige beskeder ved vigtige hændelser og sagopdateringer.",
  },
  {
    icon: "👥",
    title: "Separate login til admin og kunde",
    description: "Tydelig adskillelse mellem administrations- og kundeportal — de rette rettigheder til hver rolle.",
  },
];

export default function PlatformenPage() {
  return (
    <MarketingShell>
      <main className="bg-white">
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pb-16 md:pt-24">
          <MarketingSubpageHero
            badge="Platformen"
            title="Jeres IT — samlet ét sted"
            description={
              <>
                Overblik, support, rapporter og AI samlet på én platform. Bygget til virksomheder uden stor
                IT-afdeling — med alt I skal bruge til at træffe beslutninger og samarbejde med jeres leverandør.
              </>
            }
          >
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book-demo"
                className="cta-pulse inline-flex rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Book demo
              </Link>
              <Link
                href="/priser"
                className="cta-pulse inline-flex rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F7F7F5]"
              >
                Se priser
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Kontakt
              </Link>
            </div>
          </MarketingSubpageHero>
        </section>

        <section className="border-t border-gray-100 bg-[#F7F7F5] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollReveal key={feature.title} staggerMs={index * 75} className="h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
                    <span className="text-4xl leading-none" aria-hidden>
                      {feature.icon}
                    </span>
                    <h2 className="mt-5 text-lg font-semibold text-[#2563EB]">{feature.title}</h2>
                    <p className="mt-3 flex-1 leading-relaxed text-[#6B6B6B]">{feature.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <ScrollReveal staggerMs={0}>
            <div className="rounded-2xl border border-gray-100 bg-[#F7F7F5] px-8 py-10 md:px-12">
              <h3 className="text-xl font-bold text-[#0A0A0A]">Kom i gang</h3>
              <p className="mt-3 max-w-2xl text-[#6B6B6B]">
                Funktionerne er tilgængelige i kundeportalen — log ind for at komme i gang.
              </p>
              <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
                Gå til log ind →
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </MarketingShell>
  );
}
