import type { Metadata } from "next";
import { Handshake, Minimize2, Scale } from "lucide-react";
import { MarketingCtaSection } from "@/components/marketing/MarketingCtaSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export const metadata: Metadata = {
  title: "Om os – systemklar",
  description:
    "Vi hjælper danske SMV'er med at holde styr på deres IT. Læs om vores historie, værdier og team.",
  openGraph: {
    title: "Om os – systemklar",
    description: "Vi hjælper danske SMV'er med at holde styr på deres IT.",
    url: "https://systemklar.dk/om-os",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

const TIMELINE = [
  { year: "2024", title: "systemklar oprettet", description: "Idéen om en enkel IT-platform til SMV'er tager form." },
  { year: "2024", title: "Første kunde onboardet", description: "Automatisk overvågning og support i én løsning." },
  { year: "2025", title: "Udvidet overvågning", description: "SSL, email-sikkerhed og månedlige IT-rapporter." },
  { year: "2026", title: "Vækst i hele Danmark", description: "Flere danske virksomheder får overblik uden IT-afdeling." },
] as const;

const VALUES = [
  {
    icon: Minimize2,
    title: "Enkelthed",
    description: "IT skal være forståeligt. Hvis noget er svært at forklare, har vi ikke gjort vores arbejde ordentligt.",
  },
  {
    icon: Scale,
    title: "Ærlighed",
    description: "Klare priser, ærlig kommunikation og ingen skjulte gebyrer. Du ved altid, hvad du får.",
  },
  {
    icon: Handshake,
    title: "Tilgængelighed",
    description: "Dansk support, hurtige svar og en platform alle i virksomheden kan bruge — uden teknisk baggrund.",
  },
] as const;

export default function OmOsPage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="bg-[#F2F5FA] px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-light leading-[1.15] tracking-tight text-[#0A1628] md:text-5xl">
            Vi hjælper danske virksomheder med at holde styr på deres IT
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-[#2A4868]">
            systemklar giver SMV&apos;er samme overblik som store virksomheder — automatisk overvågning,
            besked ved fejl og support, når det gælder. Uden at ansætte en IT-afdeling.
          </p>
        </ScrollReveal>
      </section>

      {/* Historie */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal>
            <p className="text-sm font-medium uppercase tracking-wider text-[#2952A3]">Vores historie</p>
            <h2 className="mt-3 text-3xl font-light tracking-tight text-[#0A1628]">
              Bygget af frustration over uoverskuelig IT
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#2A4868]">
              Vi så for mange virksomhedsejere bruge timer på IT i stedet for deres forretning. systemklar
              blev skabt for at samle overvågning, dokumentation og support ét sted — så du altid ved, om
              dine systemer kører.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#2A4868]">
              I dag hjælper vi danske SMV&apos;er med at forebygge nedetid, dokumentere IT-sundhed og få
              hurtig hjælp, når noget går galt.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerMs={100}>
            <ol className="relative border-l border-[#CBD5E8] pl-8">
              {TIMELINE.map((item, index) => (
                <li key={`${item.year}-${item.title}`} className={index < TIMELINE.length - 1 ? "pb-10" : ""}>
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[#2952A3]" />
                  <p className="text-xs font-medium uppercase tracking-wider text-[#2952A3]">{item.year}</p>
                  <h3 className="mt-1 text-base font-medium text-[#0A1628]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#2A4868]">{item.description}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* Værdier */}
      <section className="bg-[#F2F5FA] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-light tracking-tight text-[#0A1628] md:text-4xl">
              Vores værdier
            </h2>
          </ScrollReveal>
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <ScrollReveal key={value.title} staggerMs={index * 100}>
                  <li className="h-full rounded-2xl border border-[#CBD5E8] bg-white p-8">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4EAF5] bg-[#E8EEFC] text-[#2952A3]">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <h3 className="mt-5 text-lg font-medium text-[#0A1628]">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#2A4868]">{value.description}</p>
                  </li>
                </ScrollReveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-lg">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-light tracking-tight text-[#0A1628]">Teamet</h2>
          </ScrollReveal>
          <ScrollReveal staggerMs={100}>
            <article className="mt-12 rounded-2xl border border-[#CBD5E8] bg-white p-8 text-center">
              <div
                className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full border border-[#CBD5E8] bg-[#E8EEFC] text-2xl font-medium text-[#2952A3]"
                aria-hidden
              >
                BS
              </div>
              <h3 className="mt-6 text-xl font-medium text-[#0A1628]">Benjamin Sørensen</h3>
              <p className="mt-1 text-sm font-medium text-[#2952A3]">Grundlægger</p>
              <p className="mt-4 text-sm leading-relaxed text-[#2A4868]">
                Benjamin har arbejdet med IT-support til små virksomheder i mange år. Han grundlagde
                systemklar for at give SMV&apos;er et enkelt overblik — og personlig hjælp, når det
                brænder på.
              </p>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <MarketingCtaSection />
    </MarketingShell>
  );
}
