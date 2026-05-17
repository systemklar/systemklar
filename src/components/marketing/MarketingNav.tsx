"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { DemoModal } from "@/components/ui/DemoModal";
import { StableNavLink } from "./StableNavLink";

const NAV = [
  { href: "/platformen", label: "Platformen" },
  { href: "/ai-vaerktoejer", label: "Funktioner" },
  { href: "/priser", label: "Priser" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/om-os", label: "Om os" },
] as const;

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  const transparent = !scrolled && !mobileOpen;

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          transparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-white/10 bg-[#2C3E2A]/80 shadow-sm backdrop-blur-md"
        }`}
      >
        <div className="relative mx-auto h-16 w-full max-w-[1200px] px-6">
          <div className="flex h-full items-center justify-between gap-4">
            <SystemklarLogo href="/" variant="dark" size="sm" />

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 md:flex" aria-label="Hovednavigation">
              {NAV.map((item) => (
                <StableNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={pathname === item.href}
                  className="text-white/70 hover:text-white"
                />
              ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-3 md:flex">
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white"
              >
                Log ind
              </Link>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  transparent
                    ? "bg-white text-[#8B9E6B] hover:bg-white/90"
                    : "bg-[#8B9E6B] text-white hover:bg-[#7A8A5A]"
                }`}
              >
                Book demo
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 text-white md:hidden"
              aria-label={mobileOpen ? "Luk menu" : "Åbn menu"}
              aria-expanded={mobileOpen}
              aria-controls="marketing-mobile-nav"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="marketing-mobile-nav"
          className="fixed inset-0 top-[64px] z-40 flex flex-col gap-4 bg-[#2C3E2A]/95 p-6 backdrop-blur-md md:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobil menu">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block border-b border-white/10 py-3 text-lg ${
                  pathname === item.href ? "font-semibold text-white" : "text-white/85 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block min-h-[44px] rounded-full border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              Log ind
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setShowModal(true);
              }}
              className="block min-h-[44px] w-full rounded-full bg-[#8B9E6B] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#7A8A5A]"
            >
              Book demo
            </button>
          </div>
        </div>
      ) : null}

      <DemoModal isOpen={showModal} onClose={() => setShowModal(false)} subject="Demo" />
    </>
  );
}
