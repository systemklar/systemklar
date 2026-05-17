import { FileSignature, FileText, Lock, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const FEATURES = [
  {
    icon: FileText,
    name: "Månedlig IT-rapport",
    description: "Automatisk rapport til ledelse og bestyrelse hver måned.",
  },
  {
    icon: Sparkles,
    name: "AI-assistent",
    description: "Hjælp til IT-spørgsmål og opgaver direkte i portalen.",
  },
  {
    icon: Lock,
    name: "Kodebank",
    description: "Sikkert sted til adgangskoder og login til jeres systemer.",
  },
  {
    icon: FileSignature,
    name: "IT-tilbudsgenerator",
    description: "Lav professionelle IT-tilbud hurtigt med AI.",
  },
] as const;

export function HomePlatformGrid() {
  return (
    <section id="platformen" className="scroll-mt-20 bg-[#F2F5FA] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <ScrollReveal>
          <p className="marketing-section-label">Platformen</p>
          <h2 className="marketing-section-heading mt-4 text-2xl md:text-3xl">
            Mere end support og overblik
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#2A4868]">
            Systemklar kommer med en samlet platform — alt hvad din virksomhed har brug for
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.name} staggerMs={index * 100}>
                <div className="text-left">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4EAF5] bg-white text-[#2952A3]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-sm font-medium text-[#0A1628]">{feature.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6A82A8]">{feature.description}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
