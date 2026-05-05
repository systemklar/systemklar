import Link from "next/link";

const plans = [
  {
    name: "Basis",
    price: "499 kr./md.",
    features: ["IT-overblik", "Support & sager", "Op til 10 brugere", "AI Tilbudsgenerator"],
  },
  {
    name: "Standard",
    price: "1.299 kr./md.",
    features: ["Alt i Basis", "Prioriteret support", "Op til 50 brugere", "Månedlig IT-rapport"],
  },
  {
    name: "Plus",
    price: "2.499 kr./md.",
    features: ["Alt i Standard", "AI-værktøjer inkluderet", "Ubegrænset brug", "Dedikeret onboarding"],
    highlighted: true,
  },
];

type PricingSectionProps = {
  /** HTML id for anchor links (forsiden bruger #priser). */
  sectionId?: string;
  /** Link til CTA (på /priser peger knapper til forsiden). */
  ctaHref?: string;
};

export function PricingSection({ sectionId = "priser", ctaHref = "#cta" }: PricingSectionProps) {
  return (
    <section id={sectionId} className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] md:text-3xl">Priser</h2>
      <p className="mt-3 max-w-2xl text-[#6B6B6B]">
        Vælg den pakke, der passer til jeres behov i dag — og opgrader, når I vokser.
      </p>

      <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-[#F7F7F5] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="text-3xl leading-none" aria-hidden>
            📄
          </span>
          <div>
            <p className="font-semibold text-[#0A0A0A]">AI Tilbudsgenerator i alle planer</p>
            <p className="mt-1 text-sm text-[#6B6B6B]">
              Professionelle tilbud på sekunder — med jeres priser og kundens behov som udgangspunkt.
            </p>
          </div>
        </div>
        <Link
          href="/ai-vaerktoejer"
          className="shrink-0 self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] sm:self-center"
        >
          Læs mere
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-shadow ${
              plan.highlighted ? "border-[#2563EB] shadow-md" : "border-gray-100"
            }`}
            style={plan.highlighted ? { boxShadow: "0 12px 28px rgba(37, 99, 235, 0.12)" } : undefined}
          >
            {plan.highlighted ? (
              <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                Mest populær
              </p>
            ) : null}
            <h3 className="text-xl font-semibold text-[#0A0A0A]">{plan.name}</h3>
            <p className={`mt-4 text-3xl font-bold tracking-tight ${plan.highlighted ? "text-[#2563EB]" : "text-[#0A0A0A]"}`}>
              {plan.price}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-[#6B6B6B]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-[#2563EB]" aria-hidden>
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={ctaHref}
              className="btn-primary mt-8 inline-block w-full px-5 py-2.5 text-center text-sm font-semibold"
            >
              Vælg {plan.name}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
