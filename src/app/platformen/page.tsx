import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const features = [
  {
    title: "IT-overblik",
    description:
      "Se alle systemer og status i ét dashboard — så I kan prioritere og handle i tide.",
  },
  {
    title: "Support & sager",
    description:
      "Opret og følg IT-sager med tydelig status og historik, så alle ved, hvad der sker.",
  },
  {
    title: "IT-rapport",
    description:
      "Automatisk månedlig rapport over drift og hændelser — klar til ledelse og drift.",
  },
];

export default function PlatformenPage() {
  return (
    <MarketingShell>
      <main className="bg-white">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pb-24 md:pt-24">
          <p className="mb-6 inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-4 py-2 text-sm font-medium text-[#6B6B6B]">
            Platformen
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-5xl md:leading-tight">
            Jeres IT — samlet ét sted
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-500">
            Overblik, support og rapportering uden tung administration. Bygget til virksomheder uden stor IT-afdeling.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/book-demo"
              className="inline-flex rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Book demo
            </Link>
            <Link
              href="/priser"
              className="inline-flex rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F7F7F5]"
            >
              Se priser
            </Link>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-[#F7F7F5] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold text-[#2563EB]">{feature.title}</h2>
                  <p className="mt-4 leading-relaxed text-[#6B6B6B]">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="rounded-2xl border border-gray-100 bg-[#F7F7F5] px-8 py-10 md:px-12">
            <h3 className="text-xl font-bold text-[#0A0A0A]">Vigtigt at vide</h3>
            <p className="mt-3 max-w-2xl text-[#6B6B6B]">
              Funktionerne er tilgængelige i kundeportalen — log ind for at komme i gang.
            </p>
            <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
              Gå til log ind →
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
