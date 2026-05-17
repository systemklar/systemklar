"use client";

import { useEffect, useState } from "react";

const SYSTEMS = [
  { name: "Hjemmeside", status: "OK" },
  { name: "SSL-certifikat", status: "OK" },
  { name: "Email-sikkerhed", status: "OK" },
  { name: "Domæne", status: "OK" },
] as const;

const STAGGER_MS = 300;
const BANNER_DELAY_MS = SYSTEMS.length * STAGGER_MS + 200;
const LOOP_PAUSE_MS = 3200;
const CHECKING_MS = 1400;

export function HeroStatusMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);

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
    const id = window.setTimeout(() => setShowBanner(true), 200);
    return () => window.clearTimeout(id);
  }, [visibleCount]);

  useEffect(() => {
    if (!showBanner) return;

    let cancelled = false;
    let checkTimer: ReturnType<typeof setTimeout>;
    let loopTimer: ReturnType<typeof setTimeout>;

    const runLoop = (index: number) => {
      if (cancelled) return;
      setCheckingIndex(index);
      checkTimer = setTimeout(() => {
        if (cancelled) return;
        setCheckingIndex(null);
        loopTimer = setTimeout(() => runLoop((index + 1) % SYSTEMS.length), LOOP_PAUSE_MS);
      }, CHECKING_MS);
    };

    loopTimer = setTimeout(() => runLoop(0), BANNER_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(checkTimer);
      clearTimeout(loopTimer);
    };
  }, [showBanner]);

  return (
    <div
      className="flex w-full max-w-md flex-col rounded-2xl border border-[#C8D8E4] bg-white p-5 shadow-[0_8px_32px_rgba(30,52,72,0.08)] sm:p-6"
      aria-hidden
    >
      <div
        className={`overflow-hidden rounded-xl border border-[#B8D8C0] bg-[#EEF7F0] px-3 py-2.5 transition-all duration-500 ${
          showBanner ? "mb-4 max-h-16 opacity-100" : "mb-0 max-h-0 border-transparent py-0 opacity-0"
        }`}
      >
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-[#3A7A4A]">
          <span className="marketing-status-dot h-2 w-2 rounded-full bg-[#5A9A6A]" />
          Alt fungerer
        </p>
      </div>

      <p className="text-xs font-medium uppercase tracking-wider text-[#7A9AB0]">Systemstatus</p>

      <ul className="mt-3 space-y-2">
        {SYSTEMS.map((row, i) => {
          const visible = i < visibleCount;
          const isChecking = checkingIndex === i;
          return (
            <li
              key={row.name}
              className={`flex items-center justify-between rounded-xl border border-[#E0EAF0] bg-[#F7F4EF]/80 px-3.5 py-2.5 transition-all duration-300 motion-reduce:transition-none ${
                visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <span className="flex items-center gap-2.5 text-sm text-[#4A6478]">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                    isChecking ? "bg-[#C4A84F]" : "bg-[#5A9A6A] marketing-status-dot"
                  }`}
                  style={!isChecking ? { animationDelay: `${i * 0.35}s` } : undefined}
                />
                {row.name}
              </span>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isChecking ? "text-[#9A7A30]" : "text-[#3A7A4A]"
                }`}
              >
                {isChecking ? "Tjekker..." : row.status}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-center text-[10px] text-[#7A9AB0]">Opdateres automatisk</p>
    </div>
  );
}
