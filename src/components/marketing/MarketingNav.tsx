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
    const onScroll = () => {
      setScrolled(window.scrollY > 6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-sky-100/50 bg-white/80 backdrop-blur-md transition-shadow duration-300 ease-out ${
        scrolled ? "shadow-[0_8px_24px_rgba(6,40,64,0.06)]" : "shadow-none"
      }`}
    >
      <div ref={containerRef} className="relative mx-auto h-16 w-full max-w-[1200px] px-6">
        <div className="flex h-full items-center justify-between gap-4">
          <SystemklarLogo href="/" />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 md:flex" aria-label="Hovednavigation">
            {NAV.map((item) => (
              <StableNavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Log ind
            </Link>
            <Link
              href="/book-demo"
              className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Book demo
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
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
                href="/book-demo"
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
