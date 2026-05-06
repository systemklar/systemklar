"use client";

import Link from "next/link";
import { FileText, Lock, MessageSquare, Monitor, Sparkles, Users } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    n: "01",
    icon: Monitor,
    title: "Samlet driftsoverblik",
    text: "Se systemstatus, support og handlinger samlet i én enkel visning.",
    href: "/platformen",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Support der svarer hurtigt",
    text: "Dansk support med tydelig prioritering, status og opfølgning.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "AI i daglig drift",
    text: "Automatiser rutiner og få bedre beslutninger uden ekstra støj.",
    href: "/priser",
  },
  {
    n: "04",
    icon: Lock,
    title: "Sikker adgangsstyring",
    text: "Beskyttet adgang, klare roller og sikker håndtering af data.",
    href: "/platformen",
  },
  {
    n: "05",
    icon: FileText,
    title: "Rapporter med retning",
    text: "Få klare rapporter med indsigter, ikke bare rå data.",
    href: "/platformen",
  },
  {
    n: "06",
    icon: Users,
    title: "Bygget til teams",
    text: "Ét overblik for ejere, ledelse og medarbejdere i samme platform.",
    href: "/kontakt",
  },
];

const steps = [
  { n: "01", title: "Kom i gang", text: "Vi opretter jeres miljø og tilpasser det til jeres behov." },
  { n: "02", title: "Kobl jeres systemer", text: "I tilslutter kilder — vi hjælper med opsætningen." },
  { n: "03", title: "Få live overblik", text: "Se status, sager og rapporter samlet ét sted." },
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
        className="relative flex min-h-[90vh] items-center overflow-hidden py-24 md:py-32"
        style={{ background: "linear-gradient(180deg, #EBF4FB 0%, #FFFFFF 40%)" }}
      >
        <div
          className="pointer-events-none absolute -right-[100px] -top-[100px] h-[600px] w-[600px]"
          style={{ background: "radial-gradient(circle, #0A6EBD22 0%, transparent 70%)", opacity: 0.15 }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p
            className="fade-in-up mb-10 inline-flex items-center rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-[#4A8CB5]"
            style={{ animationDelay: "0ms" }}
          >
            Bygget til danske SMV&apos;er
          </p>
          <h1
            className="fade-in-up mx-auto max-w-4xl text-5xl font-bold tracking-tight text-[#0D1F2D] md:text-7xl md:leading-[0.98]"
            style={{ animationDelay: "80ms" }}
          >
            <span className="block">Din virksomheds IT.</span>
            <span className="block">Samlet. Overskuet.</span>
          </h1>
          <p
            className="fade-in-up mx-auto mt-8 max-w-2xl text-lg text-[#4A8CB5]"
            style={{ animationDelay: "160ms" }}
          >
            Support, overvågning og AI - i et simpelt overblik.
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
              className="inline-flex rounded-full border border-sky-200 px-6 py-3 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-50"
            >
              Se hvordan det virker
            </Link>
          </div>
          <p
            className="fade-in-up mt-10 text-sm font-medium text-slate-400"
            style={{ animationDelay: "320ms" }}
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span>✓ Ingen binding</span>
              <span>✓ Dansk support</span>
              <span>✓ Gratis opsætning</span>
            </span>
          </p>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm font-medium text-[#4A8CB5]">Betroet af virksomheder i hele Danmark</p>
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
          <h2 className="text-left text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Alt hvad I har brug for</h2>
          <div className="mt-16 grid gap-6 md:grid-cols-2 md:gap-8">
            {features.map((item, index) => (
              <ScrollReveal key={item.title} staggerMs={index * 120} className="stagger-item">
                <Link href={item.href} className="group block rounded-2xl p-4 transition-colors hover:bg-sky-50">
                  <article className="grid items-center gap-4 sm:grid-cols-[120px_1fr]">
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-[#F0F7FF]">
                      <item.icon className="h-12 w-12 text-sky-600" aria-hidden />
                    </div>
                    <div>
                      <p className="fade-scale visible text-5xl font-bold leading-none text-sky-100">{item.n}</p>
                      <h3 className="mt-3 text-xl font-semibold text-[#0D1F2D]">{item.title}</h3>
                      <p className="mt-2 text-base leading-relaxed text-[#4A8CB5]">{item.text}</p>
                    </div>
                  </article>
                  <span className="mt-6 inline-block text-sm font-semibold text-sky-600 transition-colors group-hover:text-sky-700">
                    Læs mere →
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Om systemklar</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
              Vi hjælper danske virksomheder med at få styr på IT
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4A8CB5]">
              systemklar er bygget til ejerledede virksomheder der vil have professionelt IT-overblik uden at ansætte
              en IT-afdeling. Vi kombinerer support, overvågning og AI i ét simpelt overblik.
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
          <div className="overflow-hidden rounded-3xl border border-[#D0E8F5] bg-white">
            <div className="px-8 py-10">
              <p className="text-lg font-semibold text-[#0D1F2D]">Benjamin Sorensen</p>
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
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Sådan virker det</h2>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4 text-center">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-4xl font-bold text-sky-200">{s.n}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0D1F2D]">{s.title}</p>
                </div>
                {idx < steps.length - 1 ? (
                  <span className="pb-5 text-2xl text-[#4A8CB5]" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Priser</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {pricePreview.map((plan, index) => (
              <ScrollReveal key={plan.name} staggerMs={index * 100} className="stagger-item">
                <article
                  className={`rounded-3xl border px-8 py-10 text-center ${
                    plan.highlight ? "border-sky-600 bg-sky-50" : "border-[#D0E8F5]"
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

      <section id="cta" className="relative flex min-h-[400px] items-center border-b border-sky-900/70 bg-[#062840] py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Klar til at komme i gang?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-sky-200">
            Book en kort intro, og få et klart overblik over mulighederne.
          </p>
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
