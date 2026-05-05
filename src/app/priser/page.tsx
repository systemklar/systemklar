import Link from "next/link";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function PriserPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1C1917]">
      <header className="sticky top-0 z-20 border-b border-[#E7E5E4] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-blue-600">
            Systemklar
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/platformen" className="transition hover:text-[#78716C]">
              Platformen
            </Link>
            <Link href="/ai-vaerktoejer" className="transition hover:text-[#78716C]">
              AI-værktøjer
            </Link>
            <Link href="/priser" className="transition hover:text-[#78716C]">
              Priser
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex rounded-full border border-[#E7E5E4] px-4 py-2 text-sm font-semibold text-[#1C1917] hover:bg-stone-50">
              Log ind
            </Link>
            <Link href="/book-demo" className="btn-primary px-5 py-2 text-sm font-semibold shadow-sm">
              Book demo
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-12 pt-4">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <p className="inline-block rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-blue-700">
            Transparent prissætning
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
            Priser der passer til jeres virksomhed
          </h1>
          <p className="mt-4 max-w-2xl text-[#78716C]">
            Alle planer inkluderer <strong className="font-semibold text-[#1C1917]">AI Tilbudsgenerator</strong>{" "}
            — se også{" "}
            <Link href="/ai-vaerktoejer" className="font-semibold text-blue-600 underline-offset-2 hover:underline">
              øvrige AI-værktøjer
            </Link>
            .
          </p>
        </div>
        <PricingSection sectionId="priser" ctaHref="/book-demo" />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="text-2xl font-bold md:text-3xl">Sammenligning</h2>
          <p className="mt-2 text-[#78716C]">Sammenlign planer og vælg det niveau, der passer bedst til jeres behov.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#1C1917]">Funktion</th>
                  <th className="px-4 py-3 font-semibold text-[#1C1917]">Basis</th>
                  <th className="px-4 py-3 font-semibold text-[#1C1917]">Standard</th>
                  <th className="border-l-2 border-blue-600 bg-blue-50 px-4 py-3 font-semibold text-blue-700">Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["IT-overblik", "✓", "✓", "✓"],
                  ["Support & sager", "✓", "✓", "✓"],
                  ["AI Tilbudsgenerator", "✓", "✓", "✓"],
                  ["Prioriteret support", "–", "✓", "✓"],
                  ["Månedlig IT-rapport", "–", "✓", "✓"],
                  ["AI-assistent", "–", "–", "✓"],
                  ["Dedikeret onboarding", "–", "–", "✓"],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-[#1C1917]">{row[0]}</td>
                    <td className="px-4 py-3 text-[#78716C]">{row[1]}</td>
                    <td className="px-4 py-3 text-[#78716C]">{row[2]}</td>
                    <td className="border-l-2 border-blue-600 px-4 py-3 font-semibold text-blue-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#292524] bg-[#1C1917] px-6 py-12 text-sm text-stone-300">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-10 md:flex-row">
          <div>
            <p className="text-lg font-bold text-white">Systemklar</p>
            <p className="mt-2 text-slate-400">Platform til drift, support og AI-værktøjer for SMV&apos;er.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 text-slate-300 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-white">Produkt</p>
              <Link href="/platformen" className="block hover:text-white">Platformen</Link>
              <Link href="/ai-vaerktoejer" className="block hover:text-white">AI-værktøjer</Link>
              <Link href="/priser" className="block hover:text-white">Priser</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">Virksomhed</p>
              <Link href="/book-demo" className="block hover:text-white">Book demo</Link>
              <Link href="/login" className="block hover:text-white">Log ind</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">Support</p>
              <a href="mailto:kontakt@systemklar.dk" className="block hover:text-white">kontakt@systemklar.dk</a>
              <Link href="/platformen" className="block hover:text-white">Dokumentation</Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl border-t border-slate-800 pt-6 text-slate-500">
          © {new Date().getFullYear()} Systemklar. Alle rettigheder forbeholdes. CVR 46431596
        </p>
      </footer>
    </div>
  );
}
