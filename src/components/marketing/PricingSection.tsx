import { ScrollReveal } from "./ScrollReveal";
import { Briefcase, ShieldCheck, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Basis",
    price: "499 kr./md.",
    icon: Briefcase,
    features: ["IT-overblik", "Support & sager", "Op til 10 brugere", "AI Tilbudsgenerator"],
  },
  {
    name: "Standard",
    price: "1.299 kr./md.",
    icon: ShieldCheck,
    features: ["Alt i Basis", "Prioriteret support", "Op til 50 brugere", "Månedlig IT-rapport"],
  },
  {
    name: "Plus",
    price: "2.499 kr./md.",
    icon: Sparkles,
    features: ["Alt i Standard", "AI-værktøjer inkluderet", "Ubegrænset brug", "Dedikeret onboarding"],
    highlighted: true,
  },
];

type PricingSectionProps = {
  sectionId?: string;
  ctaHref?: string;
  className?: string;
};

export function PricingSection({ sectionId = "priser", ctaHref = "/kontakt", className = "" }: PricingSectionProps) {
  return (
    <div id={sectionId} className={`mx-auto max-w-6xl px-6 ${className}`}>
      <div className="grid gap-8 md:grid-cols-3 md:gap-10 lg:gap-12">
        {plans.map((plan, index) => (
          <ScrollReveal key={plan.name} staggerMs={index * 100} className="h-full">
            <article
              className={`relative flex h-full flex-col rounded-2xl border bg-white p-8 md:p-10 ${
                plan.highlighted ? "border-[#2563EB] bg-sky-50 shadow-sm ring-1 ring-[#2563EB]/10" : "border-gray-100"
              }`}
            >
              {plan.highlighted ? (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                  Mest populær
                </p>
              ) : null}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F7FF]">
                <plan.icon className="h-6 w-6 text-sky-600" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-[#0A0A0A]">{plan.name}</h3>
              <p className={`mt-5 text-3xl font-bold tracking-tight md:text-4xl ${plan.highlighted ? "text-[#2563EB]" : "text-[#0A0A0A]"}`}>
                {plan.price}
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-[#6B6B6B]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="shrink-0 text-[#2563EB]" aria-hidden>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={ctaHref}
                className="btn-primary cta-pulse mt-10 inline-block w-full px-5 py-3 text-center text-sm font-semibold"
              >
                Vælg {plan.name}
              </a>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
