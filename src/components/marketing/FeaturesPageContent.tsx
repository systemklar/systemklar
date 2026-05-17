import { Check } from "lucide-react";
import { MarketingCtaSection } from "@/components/marketing/MarketingCtaSection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MARKETING_FEATURES } from "@/lib/marketing-site-content";

export function FeaturesPageContent() {
  return (
    <>
      <section className="bg-[#F7F4EF] px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[#4A7FA5]">Funktioner</p>
          <h1 className="mt-4 text-4xl font-light leading-[1.15] tracking-tight text-[#1E3448] md:text-5xl">
            Alt I har brug for — samlet ét sted
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-[#4A6478]">
            Automatisk overvågning, besked ved fejl, rapporter og dansk support. Her er hvad vi tjekker,
            hvor ofte, og hvad I ser i portalen.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-white px-6 py-20 md:py-28">
        <ul className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          {MARKETING_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} staggerMs={index * 150}>
                <li className="h-full rounded-2xl border border-[#C8D8E4] bg-white p-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E0EAF0] bg-[#EAF1F7] text-[#4A7FA5]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <h2 className="mt-5 text-xl font-medium text-[#1E3448]">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A6478]">{feature.description}</p>

                  <div className="mt-6 space-y-4 border-t border-[#E0EAF0] pt-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#4A7FA5]">Hvad vi tjekker</p>
                      <ul className="mt-2 space-y-1.5">
                        {feature.checks.map((check) => (
                          <li key={check} className="flex items-start gap-2 text-sm text-[#4A6478]">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4A7FA5]" aria-hidden />
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#4A7FA5]">Hvor ofte</p>
                      <p className="mt-1 text-sm text-[#4A6478]">{feature.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#4A7FA5]">Det ser I</p>
                      <p className="mt-1 text-sm text-[#4A6478]">{feature.customerSees}</p>
                    </div>
                  </div>
                </li>
              </ScrollReveal>
            );
          })}
        </ul>
      </section>

      <MarketingCtaSection />
    </>
  );
}
