import Link from "next/link";
import { MessageSquare, Monitor } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const PILLARS = [
  {
    id: "it-support",
    icon: MessageSquare,
    title: "IT-support der virker",
    body: "Opret en sag når noget går galt — vi løser det. Du behøver ikke vide noget om IT. Vi svarer inden for 1 hverdag og holder dig opdateret hele vejen.",
    cta: "Se hvordan support virker",
    href: "/funktioner",
  },
  {
    id: "overblik",
    icon: Monitor,
    title: "Komplet IT-overblik",
    body: "Vi overvåger din hjemmeside, email, SSL og domæne — 24/7. Du får besked med det samme hvis noget fejler. Ingen overraskelser.",
    cta: "Se hvad vi overvåger",
    href: "/funktioner",
  },
] as const;

export function HomeTwoPillars() {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <h2 className="marketing-section-heading text-center text-2xl md:text-3xl">
            To ting du skal vide
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.id} staggerMs={index * 100}>
                <article
                  id={pillar.id}
                  className="flex h-full scroll-mt-24 flex-col rounded-2xl border border-[#CBD5E8] bg-white p-10 shadow-sm"
                >
                  <Icon className="h-10 w-10 text-[#2952A3]" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-6 text-xl font-medium text-[#0A1628]">{pillar.title}</h3>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-[#2A4868]">{pillar.body}</p>
                  <Link
                    href={pillar.href}
                    className="mt-8 inline-flex text-sm font-medium text-[#2952A3] transition-colors hover:text-[#1E4490]"
                  >
                    {pillar.cta} →
                  </Link>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
