import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const comparisonRows: [string, string, string, string][] = [
  ["IT-dashboard og overblik", "✓", "✓", "✓"],
  ["Support & sager", "✓", "✓", "✓"],
  ["Kodebank", "✓", "✓", "✓"],
  ["Månedlig IT-rapport", "–", "✓", "✓"],
  ["AI-assistent", "–", "✓", "✓"],
  ["AI Tilbudsgenerator", "–", "–", "✓"],
  ["Prioriteret support", "–", "–", "✓"],
  ["Dedikeret kontaktperson", "–", "–", "✓"],
  ["Brugere", "Op til 3", "Op til 10", "Ubegrænset"],
];

export default function PriserPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-32 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
              Priser
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Enkel pris. Ingen overraskelser.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
              Vælg den plan der passer til jer – og skift når behovet ændrer sig.
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0D1F2D]">STARTER</h3>
                <p className="mt-2 text-3xl font-bold text-[#0D1F2D]">499 kr/md</p>
                <ul className="mt-6 space-y-3 text-sm text-[#2C4A5E]">
                  {["IT-dashboard og overblik", "Support & sager", "Kodebank", "Op til 3 brugere"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-8 inline-flex w-full justify-center rounded-full border border-sky-200 px-5 py-3 font-semibold text-sky-700 hover:bg-sky-50">
                  Kom i gang
                </button>
              </article>

              <article className="relative rounded-2xl border-2 border-sky-600 bg-white p-8 shadow-md">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
                  Mest populær
                </span>
                <h3 className="text-xl font-semibold text-[#0D1F2D]">PLUS</h3>
                <p className="mt-2 text-3xl font-bold text-[#0D1F2D]">1.299 kr/md</p>
                <ul className="mt-6 space-y-3 text-sm text-[#2C4A5E]">
                  {["Alt i Starter", "Månedlig IT-rapport", "AI-assistent", "Op til 10 brugere"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-8 inline-flex w-full justify-center rounded-full bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700">
                  Kom i gang
                </button>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0D1F2D]">PRO</h3>
                <p className="mt-2 text-3xl font-bold text-[#0D1F2D]">2.499 kr/md</p>
                <ul className="mt-6 space-y-3 text-sm text-[#2C4A5E]">
                  {["Alt i Plus", "AI Tilbudsgenerator", "Prioriteret support", "Dedikeret kontaktperson", "Ubegrænset brugere"].map(
                    (item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        <span>{item}</span>
                      </li>
                    ),
                  )}
                </ul>
                <button className="mt-8 inline-flex w-full justify-center rounded-full border border-sky-200 px-5 py-3 font-semibold text-sky-700 hover:bg-sky-50">
                  Kontakt os
                </button>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D]">Hvad er forskellen?</h2>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-sky-100 bg-white">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-[#F5FAFD]">
                  <tr className="border-b border-sky-100">
                    <th className="px-4 py-3 font-semibold text-[#0D1F2D]">Funktion</th>
                    <th className="px-4 py-3 font-semibold text-[#0D1F2D]">Starter</th>
                    <th className="px-4 py-3 font-semibold text-[#0D1F2D]">Plus</th>
                    <th className="px-4 py-3 font-semibold text-[#0D1F2D]">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([label, b, s, p]) => (
                    <tr key={label} className="border-b border-sky-50">
                      <td className="px-4 py-3 text-[#0D1F2D]">{label}</td>
                      <td className="px-4 py-3 text-[#2C4A5E]">{b}</td>
                      <td className="px-4 py-3 text-[#2C4A5E]">{s}</td>
                      <td className="px-4 py-3 text-[#2C4A5E]">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D]">Ofte stillede spørgsmål</h2>
            <div className="mx-auto mt-10 max-w-3xl space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-white p-6">
                <p className="font-semibold text-[#0D1F2D]">Kan jeg skifte plan senere?</p>
                <p className="mt-2 text-sm text-[#2C4A5E]">Ja, du kan opgradere eller nedgradere når som helst.</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white p-6">
                <p className="font-semibold text-[#0D1F2D]">Er der binding?</p>
                <p className="mt-2 text-sm text-[#2C4A5E]">Nej, du betaler måned for måned og kan opsige når du vil.</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white p-6">
                <p className="font-semibold text-[#0D1F2D]">Hvad sker der når jeg opretter mig?</p>
                <p className="mt-2 text-sm text-[#2C4A5E]">
                  Vi kontakter dig inden for én hverdag for at sætte det op.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white p-6">
                <p className="font-semibold text-[#0D1F2D]">Hvad hvis jeg har brug for hjælp?</p>
                <p className="mt-2 text-sm text-[#2C4A5E]">
                  Du kan altid oprette en sag i portalen eller skrive til os.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#062840] py-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Ikke sikker på hvilken plan?</h2>
            <Link
              href="/book-demo"
              className="mt-8 inline-flex rounded-full bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
            >
              Book en gratis snak
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
