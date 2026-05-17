"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MarketingCtaNote } from "@/components/marketing/MarketingCtaNote";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

const TABS = [
  { id: "status", label: "Systemstatus" },
  { id: "support", label: "Support & sager" },
  { id: "report", label: "IT-rapport" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ROTATE_MS = 5000;

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#CBD5E8] bg-white shadow-[0_16px_48px_rgba(10,22,40,0.08)]">
      <div className="flex items-center gap-3 border-b border-[#E4EAF5] bg-[#F2F5FA] px-4 py-3">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAF5]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAF5]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAF5]" />
        </div>
        <div className="min-w-0 flex-1 rounded-md border border-[#E4EAF5] bg-white px-3 py-1.5 text-center text-[11px] text-[#6A82A8]">
          app.systemklar.dk/portal
        </div>
      </div>
      <div className="bg-[#F2F5FA] p-4 md:p-5">{children}</div>
    </div>
  );
}

function StatusMockup() {
  const rows = [
    { name: "Hjemmeside", status: "OK" },
    { name: "SSL", status: "OK" },
    { name: "DNS", status: "OK" },
  ] as const;

  return (
    <div className="relative rounded-xl border border-[#CBD5E8] bg-white p-4 shadow-sm">
      <span className="portal-mockup-cursor motion-reduce:hidden" aria-hidden />
      <div className="rounded-xl border border-emerald-100/80 bg-[#EDFAF5] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90">
            <span className="flex gap-0.5" aria-hidden>
              <span className="marketing-status-dot h-1.5 w-1.5 rounded-full bg-[#22C78A]" />
              <span
                className="marketing-status-dot h-1.5 w-1.5 rounded-full bg-[#22C78A]"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="marketing-status-dot h-1.5 w-1.5 rounded-full bg-[#22C78A]"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0A1628]">Alt fungerer som det skal</p>
            <p className="mt-0.5 text-[10px] text-[#6A82A8]">Senest tjekket for 4 min. siden</p>
          </div>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-[#E4EAF5] rounded-xl border border-[#E4EAF5] bg-white">
        {rows.map((row, i) => (
          <li key={row.name} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-[#0A1628]">{row.name}</span>
            <span className="flex items-center gap-2 text-[10px] font-medium text-[#22C78A]">
              <span
                className="marketing-status-dot h-2 w-2 rounded-full bg-[#22C78A]"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SupportMockup() {
  const tickets = [
    {
      num: "#1042",
      title: "Email virker ikke på mobil",
      status: "Aktiv",
      statusBg: "#FFFBEB",
      statusText: "#B45309",
      statusDot: "#D97706",
      date: "14. maj 2026",
    },
    {
      num: "#1038",
      title: "Opdatering af domæne-DNS",
      status: "Løst",
      statusBg: "#F0FDF4",
      statusText: "#15803D",
      statusDot: "#16a34a",
      date: "8. maj 2026",
    },
    {
      num: "#1031",
      title: "Nyt login til teammedlem",
      status: "Aktiv",
      statusBg: "#FFFBEB",
      statusText: "#B45309",
      statusDot: "#D97706",
      date: "2. maj 2026",
    },
  ] as const;

  return (
    <div className="space-y-2.5">
      {tickets.map((t) => (
        <div key={t.num} className="rounded-xl border border-[#CBD5E8] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex shrink-0 rounded-md bg-[#E8EEFC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#2A4868]">
                {t.num}
              </span>
              <p className="text-xs font-semibold text-[#0A1628]">{t.title}</p>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: t.statusBg, color: t.statusText }}
            >
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: t.statusDot }} />
              {t.status}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-[#2A4868]">Oprettet {t.date}</p>
        </div>
      ))}
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="rounded-xl border border-[#CBD5E8] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-[#0A1628]">IT-rapport — april 2026</p>
      <p className="mt-1 text-[10px] text-[#2A4868]">1. april 2026 – 30. april 2026</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#B0E8D0] bg-[#E8FAF4] px-2.5 py-1 text-[10px] font-semibold text-[#0A6A4A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C78A]" />
          Klar til download
        </span>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2952A3] px-3.5 py-2 text-[11px] font-semibold text-white"
          tabIndex={-1}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Download rapport
        </button>
      </div>
    </div>
  );
}

function MockupPanel({ tab }: { tab: TabId }) {
  switch (tab) {
    case "status":
      return <StatusMockup />;
    case "support":
      return <SupportMockup />;
    case "report":
      return <ReportMockup />;
  }
}

export function PortalPreviewShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideClass, setSlideClass] = useState("portal-slide-in-from-right");
  const pauseAuto = useRef(false);

  const activeTab = TABS[activeIndex].id;

  const transitionTo = useCallback((index: number) => {
    setActiveIndex((current) => {
      if (index !== current) {
        setSlideClass(index > current ? "portal-slide-in-from-right" : "portal-slide-in-from-left");
      }
      return index;
    });
  }, []);

  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pauseAuto.current) return;
      const next = (activeRef.current + 1) % TABS.length;
      transitionTo(next);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [transitionTo]);

  const onTabClick = (index: number) => {
    if (index === activeIndex) return;
    pauseAuto.current = true;
    setSlideClass(index > activeIndex ? "portal-slide-in-from-right" : "portal-slide-in-from-left");
    setActiveIndex(index);
    window.setTimeout(() => {
      pauseAuto.current = false;
    }, ROTATE_MS * 2);
  };

  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[#2952A3]">
            Se platformen i aktion
          </p>
          <h2 className="marketing-section-heading mt-4 text-3xl md:text-4xl">
            Alt hvad du har brug for — ét sted
          </h2>
        </ScrollReveal>

        <ScrollReveal staggerMs={80} className="mt-10">
          <div
            className="flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label="Portal forhåndsvisning"
          >
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                onClick={() => onTabClick(index)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeIndex === index
                    ? "bg-[#2952A3] text-white"
                    : "border border-[#CBD5E8] text-[#2A4868] hover:border-[#2952A3] hover:text-[#0A1628]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal staggerMs={160} className="mt-8 flex justify-center">
          <div className="w-full max-w-3xl origin-top md:scale-[0.92]" role="tabpanel" aria-label={TABS[activeIndex].label}>
            <BrowserChrome>
              <div key={activeTab} className={slideClass}>
                <MockupPanel tab={activeTab} />
              </div>
            </BrowserChrome>
          </div>
        </ScrollReveal>

        <ScrollReveal staggerMs={240} className="mt-12 text-center">
          <Link
            href={MARKETING_DEMO_HREF}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#2952A3] px-8 text-sm font-medium text-white transition-colors hover:bg-[#1E4490]"
          >
            {MARKETING_DEMO_LABEL}
          </Link>
          <MarketingCtaNote className="mt-4" />
        </ScrollReveal>
      </div>
    </section>
  );
}
