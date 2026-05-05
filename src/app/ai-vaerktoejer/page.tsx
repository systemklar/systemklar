"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AiVaerktoejerPage() {
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

  const tools = [
    {
      icon: "📄",
      title: "AI Tilbudsgenerator",
      badge: "Inkluderet i alle planer",
      description:
        "Generer professionelle tilbud på sekunder. Indtast dine priser én gang, beskriv kundens behov, og lad AI'en skrive et skræddersyet tilbud klar til afsendelse.",
      accent: "#534AB7",
    },
    {
      icon: "📊",
      title: "Månedlig IT-rapport",
      badge: "Standard & Plus",
      description:
        "Få en automatisk månedsrapport med indsigter om drift, hændelser, supportniveau og forbedringsmuligheder. Rapporten gør det lettere at følge udviklingen og træffe beslutninger på et oplyst grundlag.",
      accent: "#534AB7",
    },
    {
      icon: "💬",
      title: "AI-assistent",
      badge: "Standard & Plus",
      description:
        "Stil spørgsmål om jeres IT-opsætning og få konkrete forslag til handling. Assistenten hjælper med hurtige afklaringer i hverdagen, så både ledelse og medarbejdere kan komme videre uden unødig ventetid.",
      accent: "#534AB7",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1C1917]">
      <header className="sticky top-0 z-10 border-b border-[#E7E5E4] bg-white/95 shadow-sm backdrop-blur">
        <div ref={mobileMenuContainerRef}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Systemklar
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
              <Link href="/platformen" className="transition hover:text-[#78716C]">
                Platformen
              </Link>
              <Link
                href="/ai-vaerktoejer"
                className="transition hover:text-[#78716C]"
              >
                AI-værktøjer
              </Link>
              <Link href="/priser" className="transition hover:text-[#78716C]">
                Priser
              </Link>
              <Link href="/login" className="transition hover:text-[#78716C]">
                Log ind
              </Link>
              <Link
                href="/book-demo"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Book demo
              </Link>
            </nav>
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-[#E7E5E4] p-2 text-[#1C1917] md:hidden"
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
            className={`mx-auto w-full max-w-6xl overflow-hidden border-t border-[#E7E5E4] px-6 text-sm font-medium transition-all duration-300 ease-out md:hidden ${
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
              <Link
                href="/priser"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Priser
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log ind
              </Link>
              <Link
                href="/book-demo"
                className="mt-2 rounded-full bg-blue-600 px-5 py-2 text-center font-semibold text-white hover:bg-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Book demo
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-12">
          <p
            className="mb-5 inline-block rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#EEEAFD", color: "#534AB7" }}
          >
            AI-værktøjer
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Intelligente IT-værktøjer inkluderet i din plan
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[#78716C]">
            AI-funktionerne i Systemklar hjælper dig med at arbejde hurtigere og mere struktureret.
            <strong className="font-semibold text-slate-800"> AI Tilbudsgenerator</strong> er inkluderet i
            alle abonnementer; øvrige værktøjer afhænger af plan.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full border border-[#E7E5E4] bg-white px-6 py-3 font-semibold text-[#1C1917] shadow-sm transition hover:bg-stone-50"
          >
            Tilbage til forsiden
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            {tools.map((tool) => (
              <article key={tool.title} className="rounded-xl border border-[#E7E5E4] bg-white p-7 shadow-sm">
                <span className="text-4xl leading-none" aria-hidden>
                  {tool.icon}
                </span>
                <h2 className="mt-4 text-2xl font-semibold" style={{ color: tool.accent }}>
                  {tool.title}
                </h2>
                <p
                  className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ backgroundColor: "#EEEAFD", color: tool.accent }}
                >
                  {tool.badge}
                </p>
                <p className="mt-4 leading-7 text-[#78716C]">{tool.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-3xl border border-[#E7E5E4] bg-white px-8 py-10 shadow-sm">
            <h3 className="text-2xl font-bold">Vigtigt at vide</h3>
            <p className="mt-3 max-w-3xl text-[#78716C]">
              Disse funktioner er tilgængelige i kundeportalen - log ind for at
              komme i gang.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7E5E4] px-6 py-8 text-center text-sm text-[#78716C]">
        © {new Date().getFullYear()} Systemklar. Alle rettigheder forbeholdes.
      </footer>
    </div>
  );
}
