import type { Metadata } from "next";
import { Mail, MessageCircle, Phone, Shield, Users } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Om os – systemklar",
  description: "Mød grundlæggeren bag systemklar. Vi hjælper danske SMV'er med at få styr på IT.",
  openGraph: {
    title: "Om os – systemklar",
    description: "Mød grundlæggeren bag systemklar.",
    url: "https://systemklar.dk/om-os",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

const values = [
  {
    icon: Shield,
    title: "Enkelthed frem for alt",
    desc: "IT skal ikke være kompliceret. Hvis noget er svært at forstå, har vi ikke gjort vores arbejde ordentligt.",
  },
  {
    icon: MessageCircle,
    title: "Ærlighed og åbenhed",
    desc: "Du ved altid hvad der sker med din IT. Ingen teknisk jargon, ingen overraskelser.",
  },
  {
    icon: Users,
    title: "Mennesker først",
    desc: "Vi er ikke bare et system – vi er et team der kender dig og din virksomhed ved navn.",
  },
];

export default function OmOsPage() {
  return (
    <MarketingShell>
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-20 pt-32 md:py-32 md:pt-40">
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
              Om os
            </p>
            <AnimatedSection direction="up">
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Vi hjælper danske virksomheder med at få styr på IT
              </h1>
            </AnimatedSection>
            <AnimatedSection direction="up" delay={100}>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
                systemklar er bygget af folk der kender frustrationen ved IT der ikke virker.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              <AnimatedSection direction="left">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-600">Grundlægger</p>
                <h2 className="mb-4 text-2xl font-bold text-[#0D1F2D]">Hej, jeg er Benjamin</h2>
                <div className="space-y-4 leading-relaxed text-[#2C4A5E]">
                  <p>
                    Jeg har arbejdet med IT-support til små virksomheder i mange år. Gang på gang mødte jeg de
                    samme frustrationer: adgangskoder der forsvandt, systemer der fejlede uden varsel, og ejere
                    der brugte timer på IT i stedet for deres forretning.
                  </p>
                  <p>
                    systemklar er min løsning på det problem. En platform der samler det hele ét sted – så du
                    altid har overblik, altid kan få hjælp, og aldrig skal undre dig over om dine systemer
                    kører.
                  </p>
                  <p>Jeg sidder personligt klar til at hjælpe dig. Skriv til mig direkte.</p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="mailto:benjamin@systemklar.dk"
                    className="flex items-center gap-2 text-sm text-sky-600 hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    benjamin@systemklar.dk
                  </a>
                  <a
                    href="tel:+4522631013"
                    className="flex items-center gap-2 text-sm text-sky-600 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    +45 22 63 10 13
                  </a>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right">
                <div className="flex justify-center">
                  <div className="flex h-64 w-64 flex-col items-center justify-center rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-100 to-[#F0F7FF] shadow-sm">
                    <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#0A6EBD] text-3xl font-bold text-white">
                      BS
                    </div>
                    <p className="text-base font-semibold text-[#0D1F2D]">Benjamin Sørensen</p>
                    <p className="text-sm text-[#4A8CB5]">Grundlægger, systemklar</p>
                    <p className="mt-1 text-xs text-[#4A8CB5]">CVR 46431596</p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-12 md:py-14">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
            {[
              { tal: "100%", label: "Dansk support" },
              { tal: "< 24t", label: "Svartid på sager" },
              { tal: "0", label: "Binding" },
            ].map(({ tal, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-sky-600 md:text-4xl">{tal}</p>
                <p className="mt-2 text-sm text-[#2C4A5E]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <AnimatedSection direction="up">
              <div className="mb-10 text-center md:mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">Det vi tror på</h2>
                <p className="mx-auto mt-3 max-w-xl text-base text-[#2C4A5E]">
                  Tre principper der styrer alt hvad vi bygger og gør.
                </p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {values.map(({ icon: Icon, title, desc }, i) => (
                <AnimatedSection
                  key={title}
                  direction="up"
                  delay={(i * 100) as 0 | 100 | 200}
                >
                  <div className="h-full rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                      <Icon className="h-5 w-5 text-sky-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0D1F2D]">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#2C4A5E]">{desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection direction="up">
              <div className="mx-auto my-10 max-w-2xl rounded-3xl bg-[#062840] p-6 text-center md:my-12 md:p-8">
                <div className="mb-4 font-serif text-4xl text-sky-400">&ldquo;</div>
                <p className="text-base italic leading-relaxed text-white/90 md:text-lg">
                  Vi byggede systemklar fordi SMV&apos;er fortjener samme IT-overblik som store virksomheder
                  – uden at betale for en hel IT-afdeling.
                </p>
                <p className="mt-4 text-sm text-sky-300">– Benjamin Sørensen, Grundlægger</p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section className="border-t border-sky-100 bg-white py-16">
          <div className="mx-auto max-w-lg px-6">
            <AnimatedSection direction="up">
              <div className="rounded-2xl border border-sky-100 bg-[#F0F7FF] p-8 text-center">
                <h3 className="mb-2 text-xl font-bold text-[#0D1F2D]">Tag fat i os direkte</h3>
                <p className="mb-6 text-sm text-[#2C4A5E]">Vi svarer normalt inden for én hverdag.</p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href="mailto:benjamin@systemklar.dk"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#0A6EBD] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0859A0]"
                  >
                    <Mail className="h-4 w-4" />
                    Send en email
                  </a>
                  <a
                    href="tel:+4522631013"
                    className="flex items-center justify-center gap-2 rounded-full border border-sky-200 px-6 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                  >
                    <Phone className="h-4 w-4" />
                    +45 22 63 10 13
                  </a>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
