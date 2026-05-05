"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);
  const platformFeatures = [
    {
      icon: "🖥️",
      title: "IT-overblik",
      description:
        "Se alle systemer og status i ét dashboard.",
    },
    {
      icon: "🎫",
      title: "Support & sager",
      description:
        "Opret og følg IT-supportsager direkte i platformen.",
    },
    {
      icon: "📊",
      title: "IT-rapport",
      description:
        "Automatisk månedlig rapport over drift og status.",
    },
  ];

  const aiTools = [
    {
      icon: "⚡",
      title: "AI Tilbudsgenerator",
      description:
        "Generer professionelle tilbud på sekunder — gem priser én gang, beskriv behovet, og lad AI skrive tilbuddet klar til afsendelse.",
      includedAllPlans: true,
    },
    {
      icon: "📈",
      title: "Månedlig IT-rapport",
      description:
        "Få en automatisk status over drift, sikkerhed og forbedringsområder.",
    },
    {
      icon: "🤖",
      title: "AI-assistent",
      description:
        "Stil spørgsmål om jeres setup og få konkrete forslag med det samme.",
    },
  ];

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
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div ref={mobileMenuContainerRef}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <a href="#" className="text-2xl font-bold" style={{ color: "#1D9E75" }}>
              Systemklar
            </a>
            <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
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
              <Link href="/login" className="transition hover:text-slate-600">
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
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16">
          <p
            className="mb-5 inline-block rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#E7F6F1", color: "#1D9E75" }}
          >
            IT-platform til SMV&apos;er
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Få overblik over din virksomheds IT - uden en IT-afdeling
          </h1>
          <p className="mt-7 max-w-2xl text-xl text-slate-600">
            Systemklar samler dine systemer, support og administration et sted -
            med AI-værktøjer der gør IT-arbejdet lettere.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/book-demo" className="btn-primary px-6 py-3 font-semibold shadow-sm">
              Book en demo
            </Link>
            <a
              href="#priser"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Se priser
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">Platformen</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Tre centrale funktioner, der giver dig styr på IT fra dag et.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {platformFeatures.map((feature) => (
              <Link
                key={feature.title}
                href="/platformen"
                className="group rounded-2xl border border-slate-200 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <p className="text-2xl">{feature.icon}</p>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-slate-600">{feature.description}</p>
                <p
                  className="mt-5 text-sm font-semibold transition group-hover:opacity-80"
                  style={{ color: "#1D9E75" }}
                >
                  Læs mere om platformen -&gt;
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">AI-værktøjer</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Brug AI til at automatisere opgaver og få bedre beslutningsgrundlag.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {aiTools.map((tool) => (
              <Link
                key={tool.title}
                href="/ai-vaerktoejer"
                className="group rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: "#DCD8F6" }}
              >
                {"includedAllPlans" in tool && tool.includedAllPlans ? (
                  <p
                    className="mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: "#EEEAFD", color: "#534AB7" }}
                  >
                    Inkluderet i alle planer
                  </p>
                ) : null}
                <p className="mb-2 text-2xl">{tool.icon}</p>
                <h3 className="text-xl font-semibold" style={{ color: "#534AB7" }}>
                  {tool.title}
                </h3>
                <p className="mt-3 text-slate-600">{tool.description}</p>
                <p
                  className="mt-5 text-sm font-semibold transition group-hover:opacity-80"
                  style={{ color: "#534AB7" }}
                >
                  Se AI-værktøjerne -&gt;
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">Sådan fungerer det</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Forbind jeres setup",
                text: "Tilslut systemer og brugere på få minutter med guidet onboarding.",
              },
              {
                step: "2",
                title: "Få overblik og anbefalinger",
                text: "Se status, risici og næste skridt i et klart og handlingsorienteret view.",
              },
              {
                step: "3",
                title: "Automatiser den daglige drift",
                text: "Lad platformen og AI-værktøjerne tage de gentagne opgaver.",
              },
            ].map((item) => (
              <article key={item.step} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <PricingSection />

        <section id="cta" className="mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="rounded-3xl bg-slate-900 px-8 py-14 text-center text-white shadow-sm">
            <h2 className="text-3xl font-bold md:text-4xl">
              Klar til at få styr på jeres IT?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Start med en uforpligtende demo og se, hvordan Systemklar kan gøre
              jeres IT-drift enkel og effektiv.
            </p>
            <Link href="/book-demo" className="btn-primary mt-8 inline-block px-6 py-3 font-semibold">
              Book en demo
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Gratis demo</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">Book en demo tilpasset jeres virksomhed</h3>
                <p className="mt-2 text-slate-600">
                  Vi gennemgår platformen med udgangspunkt i jeres behov og nuværende setup.
                </p>
              </div>
              <Link href="/book-demo" className="btn-primary px-6 py-3 font-semibold">
                Book en demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-slate-950 px-6 py-10 text-sm text-slate-300">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <p className="text-lg font-semibold text-white">Systemklar</p>
            <p className="mt-2 text-slate-400">Platform til drift, support og AI-værktøjer for SMV&apos;er.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-slate-300">
            <Link href="/platformen" className="hover:text-white">Platformen</Link>
            <a href="#priser" className="hover:text-white">Priser</a>
            <Link href="/ai-vaerktoejer" className="hover:text-white">AI-værktøjer</Link>
            <Link href="/login" className="hover:text-white">Log ind</Link>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl border-t border-slate-800 pt-6 text-slate-500">
          © {new Date().getFullYear()} Systemklar. Alle rettigheder forbeholdes.
        </p>
      </footer>
    </div>
  );
}
