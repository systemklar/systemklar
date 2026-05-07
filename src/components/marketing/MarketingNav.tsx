"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SystemklarLogo } from "@/components/branding/SystemklarLogo";
import { StableNavLink } from "./StableNavLink";

const NAV = [
  { href: "/platformen", label: "Platformen" },
  { href: "/ai-vaerktoejer", label: "AI-værktøjer" },
  { href: "/priser", label: "Priser" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/om-os", label: "Om os" },
] as const;

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transparent = !scrolled && !open;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-sky-100 bg-white/90 shadow-sm backdrop-blur-md"
      }`}
    >
      <div ref={containerRef} className="relative mx-auto h-16 w-full max-w-[1200px] px-6">
        <div className="flex h-full items-center justify-between gap-4">
          <SystemklarLogo
            href="/"
            textClassName={`text-sm font-bold tracking-tight transition-colors ${
              transparent ? "text-white" : "text-sky-600"
            }`}
            primaryFill={transparent ? "#ffffff" : undefined}
            secondaryFill={transparent ? "rgba(255,255,255,0.7)" : undefined}
          />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 md:flex" aria-label="Hovednavigation">
            {NAV.map((item) => (
              <StableNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
                className={
                  transparent
                    ? "text-white/80 hover:text-white"
                    : "text-[#2C4A5E] hover:text-sky-600"
                }
              />
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                transparent
                  ? "text-white/80 hover:text-white"
                  : "text-[#2C4A5E] hover:bg-slate-50 hover:text-sky-600"
              }`}
            >
              Log ind
            </Link>
            <Link
              href="/kontakt"
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                transparent
                  ? "bg-white text-[#0A6EBD] hover:bg-white/90"
                  : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
            >
              Book demo
            </Link>
          </div>

          <button
            type="button"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors md:hidden ${
              transparent ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Luk menu" : "Åbn menu"}
            aria-expanded={open}
            aria-controls="marketing-mobile-nav"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {open ? (
          <nav
            id="marketing-mobile-nav"
            className="absolute left-0 right-0 top-full border-t border-[#D0E8F5] bg-white md:hidden"
            aria-label="Mobil menu"
          >
            <div className="mx-auto w-full max-w-[1200px] space-y-1 px-6 py-4">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block min-w-max rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-slate-50 font-semibold text-slate-900"
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="block min-w-max rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Log ind
              </Link>
              <Link
                href="/kontakt"
                className="mt-2 block rounded-full bg-sky-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-700"
              >
                Book demo
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
