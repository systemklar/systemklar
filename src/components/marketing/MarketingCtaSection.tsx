import Link from "next/link";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

type MarketingCtaSectionProps = {
  heading?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonHref?: string;
};

export function MarketingCtaSection({
  heading = "Klar til at få styr på din IT?",
  subtext = "Kom i gang på få minutter — vi hjælper dig med opsætningen.",
  buttonLabel = "Kom i gang i dag",
  buttonHref = "/login",
}: MarketingCtaSectionProps) {
  return (
    <section className="bg-[#1E3448] px-6 py-20 md:py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-light tracking-tight text-white md:text-4xl">{heading}</h2>
        <p className="mt-4 text-base leading-relaxed text-[#7A9AB0]">{subtext}</p>
        <Link
          href={buttonHref}
          className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#4A7FA5] px-10 text-base font-medium text-white transition-colors hover:bg-[#3A6F95]"
        >
          {buttonLabel}
        </Link>
      </ScrollReveal>
    </section>
  );
}
