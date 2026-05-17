"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";
import { StableNavLink } from "./StableNavLink";

const NAV = [
  { href: "/funktioner", label: "Funktioner", match: (p: string) => p === "/funktioner" },
  { href: "/priser", label: "Priser", match: (p: string) => p === "/priser" },
  { href: "/om-os", label: "Om os", match: (p: string) => p === "/om-os" },
  { href: "/kontakt", label: "Kontakt", match: (p: string) => p === "/kontakt" },
] as const;

const linkColor = "text-[#2A4868] hover:text-[#0A1628]";

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#E4EAF5] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <SystemklarLogo href="/" variant="light" size="sm" />

          <nav className="hidden items-center justify-center gap-5 lg:gap-6 xl:gap-8 md:flex" aria-label="Hovednavigation">
            {NAV.map((item) => (
              <StableNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.match(pathname ?? "")}
                className={linkColor}
              />
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-normal text-[#2A4868] transition-colors hover:text-[#0A1628]"
            >
              Log ind
            </Link>
            <Link
              href={MARKETING_DEMO_HREF}
              className="rounded-full bg-[#2952A3] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E4490]"
            >
              {MARKETING_DEMO_LABEL}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#0A1628] md:hidden"
            aria-label={mobileOpen ? "Luk menu" : "Åbn menu"}
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-nav"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Luk menu"
            className="fixed inset-0 top-16 z-40 bg-[#0A1628]/20 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="marketing-mobile-nav"
            className="fixed inset-x-0 top-16 z-50 flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto border-b border-[#E4EAF5] bg-white p-4 shadow-lg md:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobil menu">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-normal text-[#2A4868] hover:bg-[#E8EEFC] hover:text-[#0A1628]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-[#E4EAF5] pt-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center justify-center rounded-full border border-[#CBD5E8] text-sm font-medium text-[#2A4868]"
              >
                Log ind
              </Link>
              <Link
                href={MARKETING_DEMO_HREF}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center justify-center rounded-full bg-[#2952A3] text-sm font-medium text-white hover:bg-[#1E4490]"
              >
                {MARKETING_DEMO_LABEL}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
