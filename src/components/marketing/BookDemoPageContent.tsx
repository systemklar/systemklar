"use client";

import { BookDemoForm } from "./BookDemoForm";
import { MarketingContactAside } from "./MarketingContactAside";
import { MarketingSubpageHero } from "./MarketingSubpageHero";

export function BookDemoPageContent() {
  return (
    <main className="bg-[#F7F7F5] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <MarketingSubpageHero
              badge="Book en demo"
              title="Gratis gennemgang af Systemklar"
              description="Fortæl os lidt om jeres virksomhed — så kontakter vi jer og planlægger en relevant demo."
            >
              <BookDemoForm omitIntro />
            </MarketingSubpageHero>
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <MarketingContactAside concise />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
