"use client";

import Link from "next/link";
import { FileSignature, FileText, Lock, MessageSquare, Monitor, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

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
        className="relative flex min-h-[90vh] scroll-mt-20 items-center overflow-hidden bg-gradient-to-br from-[#0A6EBD] via-[#1A8FD1] to-[#062840] py-48"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p
            className="fade-in-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            IT-platform til danske SMV&apos;er
          </p>
          <AnimatedSection direction="up" delay={0}>
            <h1 className="mx-auto mt-8 max-w-4xl text-6xl font-extrabold tracking-tight text-white md:text-7xl md:leading-[0.98]">
              Få styr på IT uden at bruge
              <br className="hidden md:block" />
              hele dagen på det
            </h1>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={100}>
            <p className="mx-auto mt-8 max-w-2xl text-xl text-white/80">
              Du kan se hvad der sker, vi holder øje, og du får besked i tide.
            </p>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={200}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A6EBD] transition-all duration-100 hover:bg-white/90 active:scale-95"
              >
                Book gratis demo
              </Link>
              <Link
                href="/platformen"
                className="inline-flex rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Se hvordan det virker
              </Link>
            </div>
          </AnimatedSection>
          <p
            className="fade-in-up mt-10 text-sm font-medium text-white/60"
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

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Alt på ét sted – præcis som det er
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Se hvordan platformen ser ud i praksis, med et overblik du kan forstå med det samme.
          </p>
          <div className="mt-16 space-y-16">
            <AnimatedSection direction="right" className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">OVERBLIK</p>
                <h3 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Alt på ét sted – præcis som det er</h3>
                <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                  Du logger ind og ser med det samme hvad der kører, hvad der mangler, og om noget kræver din
                  opmærksomhed.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">systemklar.dk/portal</div>
                </div>
                <div className="flex" style={{ height: "280px" }}>
                  <div className="flex w-40 flex-col gap-1 border-r border-sky-50 bg-[#F5FAFD] p-3">
                    <div className="mb-2 text-xs font-bold text-[#0A6EBD]">systemklar</div>
                    <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-700">Overblik</div>
                    <div className="px-2 py-1.5 text-xs text-slate-500">Support & sager</div>
                    <div className="px-2 py-1.5 text-xs text-slate-500">Kodebank</div>
                    <div className="px-2 py-1.5 text-xs text-slate-500">IT-rapport</div>
                    <div className="px-2 py-1.5 text-xs text-slate-500">Systemer</div>
                  </div>
                  <div className="flex-1 bg-white p-4">
                    <div className="mb-1 text-sm font-bold text-[#0D1F2D]">Goddag, Møllers VVS</div>
                    <div className="mb-3 text-xs text-[#4A8CB5]">Her er dagens overblik.</div>
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
                        <div className="text-sm font-bold text-[#0A6EBD]">3</div>
                        <div className="text-[10px] text-[#4A8CB5]">Systemer OK</div>
                      </div>
                      <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
                        <div className="text-sm font-bold text-[#0A6EBD]">1</div>
                        <div className="text-[10px] text-[#4A8CB5]">Åben sag</div>
                      </div>
                      <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
                        <div className="text-sm font-bold text-[#0A6EBD]">apr</div>
                        <div className="text-[10px] text-[#4A8CB5]">Seneste rapport</div>
                      </div>
                    </div>
                    <div className="mb-2 text-xs font-semibold text-[#0D1F2D]">Seneste sager</div>
                    <div className="flex items-center justify-between rounded-lg bg-[#F0F7FF] px-3 py-2">
                      <span className="text-xs text-[#2C4A5E]">Printer virker ikke</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Aktiv</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="left" className="grid items-center gap-10 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">systemklar.dk/support</div>
                </div>
                <div className="p-4" style={{ height: "280px" }}>
                  <div className="mb-3 text-sm font-bold text-[#0D1F2D]">Support & sager</div>
                  <div className="flex flex-col gap-2">
                    <div className="max-w-xs self-end rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
                      Vores printer printer ikke – det haster lidt
                    </div>
                    <div className="max-w-xs self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
                      Forstået! Vi kigger på det med det samme. Kan du se om der er fejlkode på displayet?
                    </div>
                    <div className="max-w-xs self-end rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
                      Den siger "Paper jam 02"
                    </div>
                    <div className="max-w-xs self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
                      Det er en kendt fejl. Trin-for-trin guide er sendt til din mail nu.
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">SUPPORT</p>
                <h3 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Få hjælp uden at vente</h3>
                <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                  Opret en sag direkte i systemet. Du kan følge status og chatte med os – uden at ringe eller vente i
                  kø.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">IT-RAPPORT</p>
                <h3 className="mt-3 text-3xl font-bold text-[#0D1F2D]">En rapport du faktisk forstår</h3>
                <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                  Hver måned får du en overskuelig rapport med hvad der er sket, hvad vi har løst, og hvad du bør gøre
                  nu.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">systemklar.dk/rapport</div>
                </div>
                <div className="p-4" style={{ height: "280px" }}>
                  <div className="mb-1 text-sm font-bold text-[#0D1F2D]">IT-rapport – april 2026</div>
                  <div className="mb-3 text-xs text-[#4A8CB5]">Møllers VVS</div>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-green-50 p-2 text-center">
                      <div className="text-sm font-bold text-green-700">100%</div>
                      <div className="text-[10px] text-green-600">Oppetid</div>
                    </div>
                    <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
                      <div className="text-sm font-bold text-[#0A6EBD]">3</div>
                      <div className="text-[10px] text-[#4A8CB5]">Løste sager</div>
                    </div>
                    <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
                      <div className="text-sm font-bold text-[#0A6EBD]">0</div>
                      <div className="text-[10px] text-[#4A8CB5]">Åbne sager</div>
                    </div>
                  </div>
                  <div className="mb-1.5 text-xs font-semibold text-[#0D1F2D]">Anbefaling</div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Opdater Windows på 2 maskiner inden næste måned.
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Værktøjer der gør arbejdet for dig
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Tre enkle værktøjer, der hjælper dig med de opgaver, som normalt tager unødigt lang tid.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {toolFeatures.map((item, index) => (
              <AnimatedSection key={item.title} direction="up" delay={(index * 100) as 0 | 100 | 200 | 300}>
                <Link href={item.href} className="group block">
                  <article className="flex flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-5 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-[#F0F7FF] p-4">
                      {index === 0 ? (
                        <div className="w-full">
                          <div className="mb-2 text-[10px] text-[#4A8CB5]">Tilbud - VVS serviceaftale</div>
                          <div className="space-y-1">
                            <div className="h-1.5 w-full rounded bg-sky-100" />
                            <div className="h-1.5 w-5/6 rounded bg-sky-100" />
                            <div className="h-1.5 w-4/6 rounded bg-sky-100" />
                          </div>
                          <div className="mt-3 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            Klar til at sende ✓
                          </div>
                        </div>
                      ) : null}
                      {index === 1 ? (
                        <div className="w-full space-y-1.5">
                          <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-sky-600 px-2 py-1 text-[10px] text-white">
                            Hvad betyder oppetid?
                          </div>
                          <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-2 py-1 text-[10px] text-[#2C4A5E]">
                            Hvor tit jeres systemer virker uden afbrydelse.
                          </div>
                        </div>
                      ) : null}
                      {index === 2 ? (
                        <div className="w-full space-y-1.5">
                          {["Microsoft 365", "Dinero", "e-Boks"].map((row) => (
                            <div key={row} className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5">
                              <span className="text-[10px] text-[#2C4A5E]">{row}</span>
                              <span className="text-[10px] tracking-wider text-[#4A8CB5]">••••••••</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-semibold text-[#0D1F2D]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C4A5E]">{item.text}</p>
                  </article>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
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

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Sådan fungerer det</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Tre enkle trin, så du hurtigt får overblik uden at ændre hele din hverdag.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, idx) => (
              <AnimatedSection key={s.n} direction="up" delay={(idx * 100) as 0 | 100 | 200 | 300}>
                <div className="relative rounded-2xl border border-sky-100 bg-white p-6">
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
              </AnimatedSection>
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
              <AnimatedSection key={plan.name} direction="up" delay={(index * 100) as 0 | 100 | 200 | 300}>
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
              </AnimatedSection>
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
