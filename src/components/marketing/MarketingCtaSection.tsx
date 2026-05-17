import Link from "next/link";
import { MarketingCtaNote } from "@/components/marketing/MarketingCtaNote";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

type MarketingCtaSectionProps = {
  heading?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonHref?: string;
  showNote?: boolean;
};

export function MarketingCtaSection({
  heading = "Klar til en uforpligtende snak?",
  subtext = "Fortæl os om din virksomhed — vi viser dig, hvordan systemklar kan hjælpe.",
  buttonLabel = MARKETING_DEMO_LABEL,
  buttonHref = MARKETING_DEMO_HREF,
  showNote = true,
}: MarketingCtaSectionProps) {
  return (
    <section className="bg-[#0A1628] px-6 py-20 md:py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-light tracking-tight text-white md:text-4xl">{heading}</h2>
        <p className="mt-4 text-base leading-relaxed text-[#6A82A8]">{subtext}</p>
        <Link
          href={buttonHref}
          className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#2952A3] px-10 text-base font-medium text-white transition-colors hover:bg-[#1E4490]"
        >
          {buttonLabel}
        </Link>
        {showNote ? <MarketingCtaNote className="mt-4 text-[#6A82A8]" /> : null}
      </ScrollReveal>
    </section>
  );
}
