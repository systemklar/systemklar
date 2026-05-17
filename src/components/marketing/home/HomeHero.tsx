import Link from "next/link";
import { HomeHeroDashboard } from "@/components/marketing/home/HomeHeroDashboard";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

export function HomeHero() {
  return (
    <section className="home-hero-grid relative flex min-h-[calc(100svh-4rem)] items-center bg-[#0A1628] px-6 py-16 lg:py-20">
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[55fr_45fr] lg:gap-10">
        <div className="marketing-hero-enter">
          <p className="inline-flex rounded-full bg-[rgba(41,82,163,0.3)] px-4 py-1 text-sm text-[#6A92D8]">
            IT-support til danske virksomheder
          </p>
          <h1 className="marketing-hero-title mt-6 max-w-xl text-white">
            Din IT-support.
            <br />
            Dit overblik.
            <br />
            Altid klar.
          </h1>
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-[#9AAAC8]">
            Vi løser IT-problemer, overvåger dine systemer og sender dig en månedlig rapport. Du
            fokuserer på din forretning.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={MARKETING_DEMO_HREF}
              className="inline-flex items-center justify-center rounded-full bg-[#2952A3] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E4490]"
            >
              {MARKETING_DEMO_LABEL}
            </Link>
            <Link
              href="#platformen"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Se hvordan det virker
            </Link>
          </div>
          <p className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6A82A8]">
            <span>Svar inden 1 hverdag</span>
            <span className="hidden text-[#2A4868] sm:inline" aria-hidden>
              ·
            </span>
            <span>Ingen binding</span>
            <span className="hidden text-[#2A4868] sm:inline" aria-hidden>
              ·
            </span>
            <span>Dansk support</span>
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HomeHeroDashboard />
        </div>
      </div>
    </section>
  );
}
