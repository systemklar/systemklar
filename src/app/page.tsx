import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const HERO_GRADIENT = "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #F0FDF4 100%)";

const features = [
  {
    icon: "🖥️",
    title: "Platformen",
    line1: "Samlet overblik over drift og systemer.",
    line2: "Ét sted til status, hændelser og handling.",
    href: "/platformen",
  },
  {
    icon: "🤖",
    title: "AI-værktøjer",
    line1: "Hurtigere tilbud og klarere rapporter.",
    line2: "Bygget ind i jeres hverdag — ikke som ekstra rod.",
    href: "/ai-vaerktoejer",
  },
  {
    icon: "💳",
    title: "Priser",
    line1: "Planer der skalerer med jeres team.",
    line2: "Ingen skjulte gebyrer — kun det I bruger.",
    href: "/priser",
  },
];

const steps = [
  { n: "01", title: "Kom i gang", text: "Vi opretter jeres miljø og tilpasser det til jeres behov." },
  { n: "02", title: "Kobl jeres systemer", text: "I tilslutter kilder — vi hjælper med opsætningen." },
  { n: "03", title: "Få live overblik", text: "Se status, sager og rapporter samlet ét sted." },
];

const pricePreview = [
  {
    name: "Basis",
    price: "499 kr./md.",
    feats: ["IT-overblik", "Support & sager", "Op til 10 brugere"],
  },
  {
    name: "Standard",
    price: "1.299 kr./md.",
    feats: ["Alt i Basis", "Prioriteret support", "Månedlig IT-rapport"],
  },
  {
    name: "Plus",
    price: "2.499 kr./md.",
    feats: ["Alt i Standard", "AI-værktøjer", "Ubegrænset brug", "Dedikeret onboarding"],
    highlight: true,
  },
];

export default function Home() {
  return (
    <MarketingShell>
      <main>
        <section
          className="border-b border-gray-100"
          style={{ background: HERO_GRADIENT }}
        >
          <div className="mx-auto max-w-5xl px-6 pb-28 pt-24 text-center md:pb-32 md:pt-28">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-[#6B6B6B] shadow-sm backdrop-blur">
              🇩🇰 Dansk IT-platform
            </p>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-[#0A0A0A] md:text-7xl md:leading-none">
              <span className="block">Få overblik</span>
              <span className="block">over jeres</span>
              <span className="block">IT — uden</span>
              <span className="block">stor IT-afdeling</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-xl text-gray-500">
              IT-support, overblik og AI — samlet på én dansk platform.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/book-demo"
                className="inline-flex rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Book demo
              </Link>
              <Link
                href="/platformen"
                className="inline-flex rounded-full border border-gray-300 bg-white/80 px-6 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:border-gray-400 hover:bg-white"
              >
                Se platformen
              </Link>
            </div>
            <p className="mt-10 text-sm font-medium text-[#6B6B6B]">
              <span className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <span>✓ Ingen binding</span>
                <span>✓ Gratis opsætning</span>
                <span>✓ Dansk support</span>
              </span>
            </p>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-5xl leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <h2 className="mt-6 text-xl font-semibold text-[#0A0A0A]">{item.title}</h2>
                  <p className="mt-3 text-[#6B6B6B]">
                    {item.line1}
                    <br />
                    {item.line2}
                  </p>
                  <span className="mt-6 text-sm font-semibold text-[#2563EB] transition group-hover:text-[#1D4ED8]">
                    Læs mere →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-[#F7F7F5] py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-sm font-medium text-[#6B6B6B]">Betroet af virksomheder i hele Danmark</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-gray-400 md:text-base">
              {["Nordic Byg", "CopenTech", "Berglund A/S", "RetailFlow", "Møller Gruppen"].map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#0A0A0A] md:text-3xl">Sådan virker det</h2>
            <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
              {steps.map((s) => (
                <div key={s.n} className="text-center md:text-left">
                  <p className="text-6xl font-bold leading-none text-gray-200 md:text-7xl">{s.n}</p>
                  <h3 className="mt-4 text-lg font-semibold text-[#0A0A0A]">{s.title}</h3>
                  <p className="mt-2 text-[#6B6B6B]">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-[#F7F7F5] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#0A0A0A] md:text-3xl">Priser</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[#6B6B6B]">Kort overblik — se alle detaljer på pris-siden.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {pricePreview.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm ${
                    plan.highlight ? "border-[#2563EB]" : "border-gray-100"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                      Mest populær
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold text-[#0A0A0A]">{plan.name}</h3>
                  <p className={`mt-4 text-3xl font-bold ${plan.highlight ? "text-[#2563EB]" : "text-[#0A0A0A]"}`}>
                    {plan.price}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-[#6B6B6B]">
                    {plan.feats.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                  <Link
                    href="/priser"
                    className="mt-8 text-center text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Se alle planer →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="bg-[#0A0A0A] py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Klar til at prøve Systemklar?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
              Book en demo — vi viser platformen ud fra jeres behov, uden pres.
            </p>
            <Link
              href="/book-demo"
              className="mt-10 inline-flex rounded-full bg-[#2563EB] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Book demo
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
