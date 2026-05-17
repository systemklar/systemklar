import Link from "next/link";
import { ArrowRight, Monitor, Tag, Users } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const TEASERS = [
  {
    icon: Monitor,
    title: "Overvågning",
    description:
      "Automatisk overvågning af hjemmeside, SSL, email og domæne — med besked med det samme, hvis noget fejler.",
    href: "/funktioner",
    linkLabel: "Læs mere",
  },
  {
    icon: Tag,
    title: "Priser",
    price: "Fra 499 kr/md",
    description: "Enkel prissætning uden skjulte gebyrer. Ingen binding — opsig når som helst.",
    href: "/priser",
    linkLabel: "Se priser",
  },
  {
    icon: Users,
    title: "Om os",
    description:
      "Et dansk team der hjælper SMV'er med IT-overblik — uden at I skal ansætte en IT-afdeling.",
    href: "/om-os",
    linkLabel: "Mød teamet",
  },
] as const;

export function HomeTeaserSections() {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {TEASERS.map((item, index) => {
          const Icon = item.icon;
          return (
            <ScrollReveal key={item.title} staggerMs={index * 100}>
              <article className="group flex h-full flex-col rounded-2xl border border-[#C8D8E4] bg-white p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(30,52,72,0.08)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E0EAF0] bg-[#EAF1F7] text-[#4A7FA5] transition-colors group-hover:border-[#4A7FA5]/30">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2 className="mt-6 text-xl font-medium text-[#1E3448]">{item.title}</h2>
                {"price" in item && item.price ? (
                  <p className="mt-2 text-2xl font-light text-[#4A7FA5]">{item.price}</p>
                ) : null}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#4A6478]">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A7FA5] transition-colors hover:text-[#3A6F95]"
                >
                  {item.linkLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
