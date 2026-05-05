"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuContainerRef.current &&
        !mobileMenuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div ref={mobileMenuContainerRef}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-green-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path d="M4 5h16v10H4zM9 19h6M12 15v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Systemklar
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              <Link href="/platformen" className="transition hover:text-slate-600">
                Platformen
              </Link>
              <Link
                href="/ai-vaerktoejer"
                className="transition hover:text-slate-600"
              >
                AI-værktøjer
              </Link>
              <a href="#priser" className="transition hover:text-slate-600">
                Priser
              </a>
            </nav>
            <nav className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log ind
              </Link>
              <Link href="/book-demo" className="btn-primary px-5 py-2 text-sm font-semibold shadow-sm">
                Book en demo
              </Link>
            </nav>
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Luk menu" : "Åbn menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobil-menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
          <nav
            id="mobil-menu"
            className={`mx-auto w-full max-w-6xl overflow-hidden border-t border-slate-100 px-6 text-sm font-medium transition-all duration-300 ease-out md:hidden ${
              isMobileMenuOpen
                ? "max-h-96 translate-y-0 py-4 opacity-100"
                : "max-h-0 -translate-y-1 py-0 opacity-0"
            }`}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="flex flex-col gap-2">
              <Link
                href="/platformen"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Platformen
              </Link>
              <Link
                href="/ai-vaerktoejer"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                AI-værktøjer
              </Link>
              <a
                href="#priser"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Priser
              </a>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log ind
              </Link>
              <Link
                href="/book-demo"
                className="btn-primary mt-2 px-5 py-2 text-center font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Book en demo
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-24 pt-18 text-center">
          <p className="mb-6 inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            🇩🇰 Bygget til danske SMV&apos;er
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Få overblik over din virksomheds IT – uden en IT-afdeling
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
            Systemklar samler IT-support, systemovervågning og rapporter på ét sted.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book-demo" className="btn-primary px-6 py-3 font-semibold shadow-sm">
              Book gratis demo →
            </Link>
            <Link
              href="/platformen"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Se platformen
            </Link>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">
            ✓ Ingen binding&nbsp;&nbsp;&nbsp;✓ Gratis opsætning&nbsp;&nbsp;&nbsp;✓ Dansk support
          </p>
        </section>

        <section className="bg-slate-50 py-10">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
              Betroet af danske virksomheder
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center md:grid-cols-5">
              {["Nordic Byg", "CopenTech", "Berglund A/S", "RetailFlow", "Møller Gruppen"].map((brand) => (
                <div key={brand} className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-sm font-semibold text-slate-500">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Alt hvad din virksomhed har brug for</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🖥️",
                title: "Systemovervågning",
                text: "Hold øje med alle dine IT-systemer live",
              },
              {
                icon: "🎫",
                title: "IT-support",
                text: "Opret og håndter supportsager direkte i portalen",
              },
              {
                icon: "🤖",
                title: "AI-værktøjer",
                text: "Generer tilbud og IT-rapporter med kunstig intelligens",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-green-600 hover:shadow-md"
              >
                <p className="text-3xl">{feature.icon}</p>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Sådan virker det</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              "Vi opretter din profil",
              "Du tilkobler dine systemer",
              "Få live overblik",
            ].map((step, idx) => (
              <div key={step} className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                  {idx + 1}
                </span>
                <p className="mt-4 font-semibold text-slate-900">{step}</p>
                {idx < 2 ? <span className="pointer-events-none absolute right-[-14px] top-1/2 hidden -translate-y-1/2 text-xl text-green-600 md:block">→</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section id="priser" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Priser</h2>
          <p className="mt-3 text-center text-slate-600">Vælg planen der passer bedst til jeres virksomhed.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { name: "Basis", price: "499 kr./md.", features: ["✓ IT-overblik", "✓ Supportportal", "✓ Op til 10 brugere"] },
              { name: "Standard", price: "1.299 kr./md.", features: ["✓ Alt i Basis", "✓ Prioriteret support", "✓ Op til 50 brugere"] },
              { name: "Plus", price: "2.499 kr./md.", features: ["✓ Alt i Standard", "✓ AI-værktøjer", "✓ Ubegrænset brug"], highlighted: true },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${plan.highlighted ? "border-green-600" : "border-slate-200"}`}
              >
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-3 text-3xl font-bold ${plan.highlighted ? "text-green-600" : "text-slate-900"}`}>
                  {plan.price}
                </p>
                <ul className="mt-5 space-y-2 text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/priser" className="text-sm font-semibold text-green-700 hover:underline">
              Se alle features →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Det siger vores kunder</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { quote: "Systemklar gav os overblik fra dag ét. Vi sparer timer hver uge.", name: "Mads N.", company: "Nordic Byg" },
              { quote: "Support-flowet er enkelt, og vores team får hurtigere svar.", name: "Louise K.", company: "RetailFlow" },
              { quote: "AI-værktøjerne gør tilbudsprocessen langt mere effektiv.", name: "Andreas P.", company: "CopenTech" },
            ].map((t) => (
              <blockquote key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-2xl text-green-600">“</p>
                <p className="mt-2 text-slate-700">{t.quote}</p>
                <footer className="mt-4 text-sm font-semibold text-slate-900">
                  {t.name} <span className="font-normal text-slate-500">· {t.company}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="cta" className="mx-auto max-w-6xl px-6 pb-20 pt-4">
          <div className="rounded-3xl bg-green-700 px-8 py-14 text-center text-white shadow-sm">
            <h2 className="text-3xl font-bold md:text-4xl">Klar til at prøve Systemklar?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-green-100">
              Book en gratis demo og få en skræddersyet gennemgang af platformen.
            </p>
            <Link href="/book-demo" className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50">
              Book gratis demo
            </Link>
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
