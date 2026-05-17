"use client";

import { AlertTriangle, Check } from "lucide-react";
import { useEffect, useState } from "react";

const SYSTEMS = [
  { name: "Hjemmeside", status: "ok" as const },
  { name: "SSL", status: "ok" as const },
  { name: "DNS", status: "ok" as const },
  { name: "Domæne", status: "warn" as const },
] as const;

const STAGGER_MS = 280;

export function HomeHeroDashboard() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (visibleCount >= SYSTEMS.length) return;
    const id = window.setTimeout(() => setVisibleCount((c) => c + 1), STAGGER_MS);
    return () => window.clearTimeout(id);
  }, [visibleCount]);

  useEffect(() => {
    if (visibleCount < SYSTEMS.length) {
      setShowBanner(false);
      return;
    }
    const id = window.setTimeout(() => setShowBanner(true), 300);
    return () => window.clearTimeout(id);
  }, [visibleCount]);

  return (
    <div
      className="home-hero-float w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label-caps !mb-0">Systemstatus</p>
        <p
          className={`flex items-center gap-2 text-sm font-medium text-[#0A6A4A] transition-opacity duration-500 ${
            showBanner ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#22C78A]" />
          Alt fungerer
        </p>
      </div>

      <ul className="mt-4 space-y-2.5">
        {SYSTEMS.map((row, i) => {
          const visible = i < visibleCount;
          const isWarn = row.status === "warn";
          return (
            <li
              key={row.name}
              className={`flex items-center justify-between rounded-xl border border-[#E4EAF5] bg-[#F2F5FA] px-4 py-2.5 transition-all duration-300 ${
                visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <span className="text-sm text-[#2A4868]">{row.name}</span>
              {isWarn ? (
                <AlertTriangle className="h-4 w-4 text-[#F0A030]" aria-hidden />
              ) : (
                <Check className="h-4 w-4 text-[#22C78A]" strokeWidth={2.5} aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        tabIndex={-1}
        className="mt-5 w-full rounded-full bg-[#2952A3] py-2.5 text-sm font-medium text-white"
      >
        Opret IT-sag
      </button>
    </div>
  );
}
