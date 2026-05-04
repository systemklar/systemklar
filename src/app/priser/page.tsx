import Link from "next/link";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function PriserPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold" style={{ color: "#1D9E75" }}>
            Systemklar
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm font-medium">
            <Link href="/platformen" className="transition hover:text-slate-600">
              Platformen
            </Link>
            <Link href="/ai-vaerktoejer" className="transition hover:text-slate-600">
              AI-værktøjer
            </Link>
            <Link href="/login" className="transition hover:text-slate-600">
              Log ind
            </Link>
            <Link
              href="/#cta"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#1D9E75" }}
            >
              Kom i gang
            </Link>
          </nav>
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
        <PricingSection sectionId="priser" ctaHref="/#cta" />
      </main>

      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Systemklar. Alle rettigheder forbeholdes.
      </footer>
    </div>
  );
}
