"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/platformen", label: "Platformen" },
  { href: "/ai-vaerktoejer", label: "AI-værktøjer" },
  { href: "/priser", label: "Priser" },
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
    setOpen(false);
  }, [pathname]);

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
      className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur transition-[box-shadow,border-color] duration-300 ease-out ${
        scrolled ? "border-gray-200/90 shadow-md shadow-gray-900/5" : "border-gray-100 shadow-none"
      }`}
    >
      <div ref={containerRef} className="relative mx-auto h-16 max-w-6xl px-6">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#2563EB]">
            Systemklar
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Hovednavigation">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    active ? "font-semibold text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Log ind
            </Link>
            <Link
              href="/book-demo"
              className="rounded-full bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Book demo
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-50 md:hidden"
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
            className="absolute left-0 right-0 top-full border-b border-gray-100 bg-white shadow-lg md:hidden"
            aria-label="Mobil menu"
          >
            <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Log ind
              </Link>
              <Link
                href="/book-demo"
                className="mt-2 block rounded-full bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#1D4ED8]"
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
