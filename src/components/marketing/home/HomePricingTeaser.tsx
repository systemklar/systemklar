import Link from "next/link";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const PLANS = [
  {
    name: "Starter",
    price: "499 kr/md",
    features: "IT-support + grundlæggende overvågning + månedlig rapport",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "999 kr/md",
    features: "Alt i Starter + prioriteret support + avanceret overvågning + API-integrationer",
    highlighted: true,
  },
] as const;

export function HomePricingTeaser() {
  return (
    <section className="bg-[#0A1628] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <ScrollReveal>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#6A92D8]">Priser</p>
          <h2 className="marketing-section-heading mt-4 text-2xl text-white md:text-3xl">
            Simpel prissætning. Ingen overraskelser.
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {PLANS.map((plan, index) => (
            <ScrollReveal key={plan.name} staggerMs={index * 100}>
              <article
                className={`flex h-full flex-col rounded-2xl border p-8 text-left ${
                  plan.highlighted
                    ? "border-[#2952A3] bg-[#0F1E38]"
                    : "border-[#1A3060] bg-[#0F1E38]"
                }`}
              >
                <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                <p className="mt-2 text-3xl font-light text-white">{plan.price}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#9AAAC8]">{plan.features}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal staggerMs={200}>
          <p className="mt-6 text-xs text-[#6A82A8]">Alle priser ex. moms</p>
          <Link
            href="/priser"
            className="mt-6 inline-flex text-sm font-medium text-[#6A92D8] transition-colors hover:text-white"
          >
            Se fulde priser →
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
