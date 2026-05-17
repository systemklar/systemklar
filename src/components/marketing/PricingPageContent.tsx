"use client";

import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { MarketingCtaSection } from "@/components/marketing/MarketingCtaSection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import {
  PLAN_COMPARISON_ROWS,
  PRICING_BILLING_FAQ,
  PRICING_PLANS,
} from "@/lib/marketing-site-content";
import { MARKETING_DEMO_HREF, MARKETING_DEMO_LABEL } from "@/lib/marketing-cta";

export function PricingPageContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="bg-[#F7F4EF] px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[#4A7FA5]">Priser</p>
          <h1 className="mt-4 text-4xl font-light leading-[1.15] tracking-tight text-[#1E3448] md:text-5xl">
            Enkel prissætning uden overraskelser
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-[#4A6478]">
            Vælg den plan der passer til jeres størrelse. Ingen binding — opsig når som helst.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {PRICING_PLANS.map((plan, index) => (
            <ScrollReveal key={plan.name} staggerMs={index * 100}>
              <article
                className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-[#4A7FA5] bg-white shadow-[0_8px_24px_rgba(74,127,165,0.12)]"
                    : "border-[#C8D8E4] bg-white"
                }`}
              >
                {plan.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4A7FA5] px-3 py-1 text-xs font-medium text-white">
                    Mest populær
                  </span>
                ) : null}
                <h2 className="text-lg font-medium text-[#1E3448]">{plan.name}</h2>
                <p className="mt-2 text-3xl font-light text-[#4A7FA5]">{plan.price}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#4A6478]">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#4A6478]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4A7FA5]" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={MARKETING_DEMO_HREF}
                  className={`mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-[#4A7FA5] text-white hover:bg-[#3A6F95]"
                      : "border border-[#C8D8E4] text-[#4A6478] hover:border-[#4A7FA5] hover:text-[#1E3448]"
                  }`}
                >
                  {MARKETING_DEMO_LABEL}
                </Link>
              </article>
            </ScrollReveal>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-[#7A9AB0]">
          Alle priser er ex. moms · Ingen binding
        </p>
      </section>

      <section className="bg-[#F7F4EF] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-light tracking-tight text-[#1E3448] md:text-3xl">
              Sammenlign planer
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerMs={100}>
            <div className="mt-10 overflow-hidden rounded-2xl border border-[#C8D8E4] bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E0EAF0] bg-[#F7F4EF]">
                    <th scope="col" className="px-5 py-4 font-medium text-[#1E3448]">
                      Funktion
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium text-[#1E3448]">
                      Starter
                    </th>
                    <th scope="col" className="px-5 py-4 font-medium text-[#4A7FA5]">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_COMPARISON_ROWS.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index < PLAN_COMPARISON_ROWS.length - 1 ? "border-b border-[#E0EAF0]" : ""}
                    >
                      <th scope="row" className="px-5 py-4 font-normal text-[#4A6478]">
                        {row.label}
                      </th>
                      <td className="px-5 py-4 text-[#1E3448]">{row.starter}</td>
                      <td className="px-5 py-4 font-medium text-[#1E3448]">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-light tracking-tight text-[#1E3448] md:text-3xl">
              Fakturering og opsigelse
            </h2>
          </ScrollReveal>
          <ul className="mt-10 space-y-3">
            {PRICING_BILLING_FAQ.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <ScrollReveal key={item.question} staggerMs={index * 60}>
                  <li className="overflow-hidden rounded-2xl border border-[#C8D8E4] bg-[#F7F4EF]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-[#1E3448] md:text-base">{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#4A7FA5] transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-[#E0EAF0] bg-white px-5 pb-4 pt-2">
                        <p className="text-sm leading-relaxed text-[#4A6478]">{item.answer}</p>
                      </div>
                    ) : null}
                  </li>
                </ScrollReveal>
              );
            })}
          </ul>
        </div>
      </section>

      <MarketingCtaSection />
    </>
  );
}
