"use client";

import Link from "next/link";
import { FileSignature, FileText, Lock, MessageSquare, Monitor, Sparkles } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const platformFeatures = [
  {
    n: "01",
    icon: Monitor,
    title: "Vi holder øje med dine systemer",
    text: "Du kan altid se om alt kører, og du får besked hvis noget driller.",
    href: "/platformen",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Få hjælp uden ventetid",
    text: "Opret en sag, følg status, og se hvad næste skridt er – i almindeligt sprog.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "03",
    icon: FileText,
    title: "Rapporter du kan forstå",
    text: "Se kort hvad der fungerer, hvad der skal fixes, og hvad du bør gøre nu.",
    href: "/platformen",
  },
];

const toolFeatures = [
  {
    n: "01",
    icon: FileSignature,
    title: "Tilbud på 2 minutter",
    text: "Beskriv hvad kunden skal bruge. Få et færdigt tilbud klar til at sende.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Spørg løs på dansk",
    text: "Stil spørgsmål om din IT og få et svar du faktisk forstår.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "03",
    icon: Lock,
    title: "Adgangskoder samlet sikkert",
    text: "Ét sted til alle passwords – kun du og dit team har adgang.",
    href: "/platformen",
  },
];

const steps = [
  { n: "1", title: "Vi starter sammen", text: "Vi sætter det op for jer, så I hurtigt kommer i gang." },
  { n: "2", title: "Vi kobler jeres drift på", text: "Jeres systemer og support samles ét sted." },
  { n: "3", title: "I får ro i hverdagen", text: "I kan se status med det samme, uden at gætte." },
];

const pricePreview = [
  {
    name: "Starter",
    price: "499 kr/md",
  },
  {
    name: "Plus",
    price: "1.299 kr/md",
    highlight: true,
  },
  {
    name: "Pro",
    price: "2.499 kr/md",
  },
];

export function MarketingHomeContent() {
  return (
    <main>
      <section
        className="relative flex min-h-[90vh] scroll-mt-20 items-center overflow-hidden py-40"
        style={{ background: "linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 55%)" }}
      >
        <div
          className="pointer-events-none absolute -right-[100px] -top-[100px] h-[600px] w-[600px]"
          style={{ background: "radial-gradient(circle, #0A6EBD22 0%, transparent 70%)", opacity: 0.15 }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p
            className="fade-in-up inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden />
            IT-platform til danske SMV&apos;er
          </p>
          <h1
            className="fade-in-up mx-auto mt-8 max-w-4xl text-5xl font-bold tracking-tight text-[#0D1F2D] md:text-7xl md:leading-[0.98]"
            style={{ animationDelay: "80ms" }}
          >
            Få styr på IT uden at bruge
            <br className="hidden md:block" />
            hele dagen på det
          </h1>
          <p
            className="fade-in-up mx-auto mt-8 max-w-2xl text-lg text-[#2C4A5E]"
            style={{ animationDelay: "160ms" }}
          >
            Du kan se hvad der sker, vi holder øje, og du får besked i tide.
          </p>
          <div
            className="fade-in-up mt-12 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/book-demo"
              className="inline-flex rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Book gratis demo
            </Link>
            <Link
              href="/platformen"
              className="inline-flex rounded-full border border-sky-100 px-6 py-3 text-sm font-semibold text-[#0D1F2D] transition-colors hover:bg-[#F0F7FF]"
            >
              Se hvordan det virker
            </Link>
          </div>
          <p
            className="fade-in-up mt-10 text-sm font-medium text-[#4A8CB5]"
            style={{ animationDelay: "320ms" }}
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span>Ingen binding</span>
              <span>·</span>
              <span>Opsig når som helst</span>
              <span>·</span>
              <span>Gratis at starte</span>
            </span>
          </p>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Betroet i hele Danmark</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Virksomheder på tværs af brancher bruger systemklar til at få mere ro på IT.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm font-medium text-stone-400 md:grid-cols-5 md:gap-8">
            {["Nordic Byg", "CopenTech", "Berglund A/S", "RetailFlow", "Moller Gruppen"].map((name) => (
              <span key={name} className="whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Hvad du får med systemklar
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Alt det vigtigste samlet i ét roligt overblik, så du kan fokusere på din forretning.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {platformFeatures.map((item, index) => (
              <ScrollReveal key={item.title} staggerMs={index * 120} className="stagger-item">
                <Link href={item.href} className="group block">
                  <article className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                      <item.icon className="h-6 w-6 text-sky-600" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0D1F2D]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C4A5E]">{item.text}</p>
                    <p className="mt-4 text-sm font-medium text-sky-600">Se mere →</p>
                  </article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Værktøjer der gør arbejdet for dig
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Praktiske værktøjer, så du kan løse opgaver hurtigere uden ekstra systemer.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {toolFeatures.map((item, index) => (
              <ScrollReveal key={item.title} staggerMs={index * 120} className="stagger-item">
                <Link href={item.href} className="group block">
                  <article className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                      <item.icon className="h-6 w-6 text-sky-600" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0D1F2D]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C4A5E]">{item.text}</p>
                    <p className="mt-4 text-sm font-medium text-sky-600">Se mere →</p>
                  </article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4A8CB5]">Om systemklar</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
              Vi hjælper små virksomheder med at få ro på IT
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#2C4A5E]">
              Du får et enkelt overblik over support, systemer og opgaver. Det betyder færre overraskelser, hurtigere
              svar og mindre tid brugt på at jagte status.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">100%</p>
                <p className="text-sm text-[#4A8CB5]">Dansk support</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">1 platform</p>
                <p className="text-sm text-[#4A8CB5]">Alt samlet</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">0 binding</p>
                <p className="text-sm text-[#4A8CB5]">Kom i gang i dag</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white">
            <div className="px-8 py-10">
              <p className="text-lg font-semibold text-[#0D1F2D]">Benjamin Sørensen</p>
              <p className="mt-1 text-sm text-[#4A8CB5]">Grundlægger, systemklar</p>
            </div>
            <div className="bg-[#062840] px-8 py-8">
              <p className="text-lg leading-relaxed text-white">
                "Vi byggede systemklar fordi SMV&apos;er fortjener samme IT-overblik som store virksomheder."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Sådan fungerer det</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Tre enkle trin, så du hurtigt får overblik uden at ændre hele din hverdag.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, idx) => (
              <div key={s.n} className="relative rounded-2xl border border-sky-100 bg-white p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-[#0D1F2D]">{s.title}</p>
                    <p className="mt-1 text-sm text-[#2C4A5E]">{s.text}</p>
                  </div>
                </div>
                {idx < steps.length - 1 ? (
                  <span className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-xl text-sky-300 md:block" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Priser</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Vælg den plan der passer til jer i dag, og skift når behovet ændrer sig.
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {pricePreview.map((plan, index) => (
              <ScrollReveal key={plan.name} staggerMs={index * 100} className="stagger-item">
                <article
                  className={`rounded-3xl border px-8 py-10 text-center ${
                    plan.highlight
                      ? "border-2 border-sky-600 bg-white shadow-md"
                      : "border border-sky-200 bg-white shadow-sm"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#4A8CB5]">{plan.name}</p>
                  <p className="mt-4 text-4xl font-bold text-[#0D1F2D]">{plan.price}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/priser" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
              Se alle features →
            </Link>
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative flex min-h-[400px] items-center border-b border-sky-900/70 bg-[#062840] bg-gradient-to-br from-[#062840] to-[#0A3D5C] py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Klar til at komme i gang?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#7AAEC8]">
            Få en kort gennemgang, så du ved præcis hvordan det virker i din hverdag.
          </p>
          <p className="mt-4 text-sm text-[#7AAEC8]">Ingen binding · Opsig når som helst</p>
          <Link
            href="/book-demo"
            className="mt-10 inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            Book gratis demo
          </Link>
        </div>
      </section>
    </main>
  );
}
