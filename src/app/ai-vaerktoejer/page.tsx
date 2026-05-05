import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const tools = [
  {
    icon: "📄",
    title: "AI Tilbudsgenerator",
    badge: "Inkluderet i alle planer",
    description:
      "Professionelle tilbud på sekunder — jeres priser og kundens behov som udgangspunkt.",
  },
  {
    icon: "📊",
    title: "Månedlig IT-rapport",
    badge: "Standard & Plus",
    description: "Automatisk månedsrapport med indsigt i drift, hændelser og forbedringsmuligheder.",
  },
  {
    icon: "💬",
    title: "AI-assistent",
    badge: "Plus",
    description: "Spørg ind til jeres opsætning og få konkrete forslag — uden at vente på næste møde.",
  },
];

export default function AiVaerktoejerPage() {
  return (
    <MarketingShell>
      <main className="bg-white">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pb-24 md:pt-24">
          <p className="mb-6 inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-4 py-2 text-sm font-medium text-[#6B6B6B]">
            AI-værktøjer
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-5xl md:leading-tight">
            Intelligente værktøjer i jeres plan
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-500">
            <strong className="font-semibold text-[#0A0A0A]">AI Tilbudsgenerator</strong> følger med alle abonnementer.
            Øvrige funktioner afhænger af plan.
          </p>
          <Link
            href="/priser"
            className="mt-10 inline-flex text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
          >
            Sammenlign planer →
          </Link>
        </section>

        <section className="border-t border-gray-100 bg-[#F7F7F5] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {tools.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md"
                >
                  <span className="text-5xl leading-none" aria-hidden>
                    {tool.icon}
                  </span>
                  <h2 className="mt-6 text-xl font-semibold text-[#2563EB]">{tool.title}</h2>
                  <p className="mt-3 inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                    {tool.badge}
                  </p>
                  <p className="mt-5 leading-relaxed text-[#6B6B6B]">{tool.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="rounded-2xl border border-gray-100 bg-[#F7F7F5] px-8 py-10 md:px-12">
            <h3 className="text-xl font-bold text-[#0A0A0A]">Vigtigt at vide</h3>
            <p className="mt-3 max-w-2xl text-[#6B6B6B]">
              Funktionerne findes i kundeportalen — log ind for at komme i gang.
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
