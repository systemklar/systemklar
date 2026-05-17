"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const FAQ_ITEMS = [
  {
    question: "Hvad overvåger I?",
    answer:
      "Vi overvåger typisk jeres hjemmeside, SSL-certifikat, email-sikkerhed (DNS) og domæne — og giver besked med det samme, hvis noget fejler. Flere systemer kan tilføjes på Pro-planen.",
  },
  {
    question: "Kræver det teknisk viden at komme i gang?",
    answer:
      "Nej. Vi guider jer gennem opsætningen, og de fleste virksomheder er klar på under 10 minutter. I behøver ikke en IT-afdeling for at bruge systemklar.",
  },
  {
    question: "Kan jeg opsige når som helst?",
    answer:
      "Ja. Der er ingen binding. I kan opsige med kort varsel og fortsætte indtil periodens udløb.",
  },
  {
    question: "Hvad sker der når et system fejler?",
    answer:
      "I modtager en email med det samme, når vi registrerer et problem. I kan også se status i portalen og oprette en support-sag, hvis I har brug for hjælp.",
  },
  {
    question: "Er mine data sikre?",
    answer:
      "Ja. Data behandles i overensstemmelse med gældende lovgivning, og vi bruger sikker hosting. Læs mere i vores privatlivspolitik og databehandleraftale.",
  },
] as const;

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#F2F5FA] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <h2 className="marketing-section-heading text-center text-2xl md:text-3xl">
            Ofte stillede spørgsmål
          </h2>
        </ScrollReveal>
        <ul className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal key={item.question} staggerMs={index * 80}>
                <li className="overflow-hidden rounded-2xl border border-[#CBD5E8] bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium text-[#0A1628] md:text-base">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#2952A3] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-[#E4EAF5] px-5 pb-4 pt-2">
                      <p className="text-sm leading-relaxed text-[#2A4868]">{item.answer}</p>
                    </div>
                  ) : null}
                </li>
              </ScrollReveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
