import Link from "next/link";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function PriserPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-green-600">
            Systemklar
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/platformen" className="transition hover:text-slate-600">
              Platformen
            </Link>
            <Link href="/ai-vaerktoejer" className="transition hover:text-slate-600">
              AI-værktøjer
            </Link>
            <Link href="/priser" className="transition hover:text-slate-600">
              Priser
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Log ind
            </Link>
            <Link href="/book-demo" className="btn-primary px-5 py-2 text-sm font-semibold shadow-sm">
              Book en demo
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-12 pt-4">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <p
            className="inline-block rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#E7F6F1", color: "#1D9E75" }}
          >
            Transparent prissætning
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
            Priser der passer til jeres virksomhed
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Alle planer inkluderer <strong className="font-semibold text-slate-800">AI Tilbudsgenerator</strong>{" "}
            — se også{" "}
            <Link href="/ai-vaerktoejer" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
              øvrige AI-værktøjer
            </Link>
            .
          </p>
        </div>
        <PricingSection sectionId="priser" ctaHref="/book-demo" />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="text-2xl font-bold md:text-3xl">Sammenligning</h2>
          <p className="mt-2 text-slate-600">Sammenlign planer og vælg det niveau, der passer bedst til jeres behov.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Funktion</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Basis</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Standard</th>
                  <th className="border-l-2 border-green-600 bg-green-50 px-4 py-3 font-semibold text-green-700">Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["IT-overblik", "✓", "✓", "✓"],
                  ["Support & sager", "✓", "✓", "✓"],
                  ["AI Tilbudsgenerator", "✓", "✓", "✓"],
                  ["Prioriteret support", "–", "✓", "✓"],
                  ["Månedlig IT-rapport", "–", "✓", "✓"],
                  ["AI-assistent", "–", "–", "✓"],
                  ["Dedikeret onboarding", "–", "–", "✓"],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row[0]}</td>
                    <td className="px-4 py-3 text-slate-700">{row[1]}</td>
                    <td className="px-4 py-3 text-slate-700">{row[2]}</td>
                    <td className="border-l-2 border-green-600 px-4 py-3 font-semibold text-green-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-gray-900 px-6 py-12 text-sm text-slate-300">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-10 md:flex-row">
          <div>
            <p className="text-lg font-bold text-green-500">Systemklar</p>
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
          © {new Date().getFullYear()} Systemklar. Alle rettigheder forbeholdes.
        </p>
      </footer>
    </div>
  );
}
