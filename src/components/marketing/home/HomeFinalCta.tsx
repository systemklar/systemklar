import Link from "next/link";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MARKETING_CTA_NOTE, MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

export function HomeFinalCta() {
  return (
    <section className="bg-[#2952A3] px-6 py-20 md:py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="marketing-section-heading text-2xl text-white md:text-3xl">
          Klar til at få styr på din IT?
        </h2>
        <p className="mt-4 text-base text-white/70">
          Book en uforpligtende demo — vi kontakter dig inden for 1 hverdag
        </p>
        <Link
          href={MARKETING_DEMO_HREF}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-10 py-3 text-base font-medium text-[#2952A3] transition-colors hover:bg-[#F2F5FA]"
        >
          {MARKETING_DEMO_LABEL}
        </Link>
        <p className="mt-4 text-sm text-white/70">Ingen binding · Ingen kreditkort</p>
        <p className="sr-only">{MARKETING_CTA_NOTE}</p>
      </ScrollReveal>
    </section>
  );
}
