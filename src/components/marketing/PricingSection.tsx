import Link from "next/link";

const plans = [
  {
    name: "Basis",
    price: "499 kr./md.",
    features: ["Grundlæggende IT-overblik", "E-mail support", "Op til 10 brugere"],
  },
  {
    name: "Standard",
    price: "1.299 kr./md.",
    features: ["Alt i Basis", "Prioriteret support", "Op til 50 brugere"],
  },
  {
    name: "Plus",
    price: "2.499 kr./md.",
    features: ["Alt i Standard", "AI-værktøjer inkluderet", "Ubegrænset brug"],
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
    <section id={sectionId} className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="text-2xl font-bold md:text-3xl">Priser</h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        Vælg den pakke, der passer til jeres behov i dag - og opgrader, når I vokser.
      </p>

      <div
        className="mt-8 flex flex-col gap-4 rounded-2xl border px-6 py-5 md:flex-row md:items-center md:justify-between"
        style={{
          borderColor: "rgba(29, 158, 117, 0.35)",
          backgroundColor: "#F2FBF8",
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="text-3xl leading-none" aria-hidden>
            📄
          </span>
          <div>
            <p className="font-semibold text-slate-900">AI Tilbudsgenerator i alle planer</p>
            <p className="mt-1 text-sm text-slate-600">
              Uanset om I vælger Basis, Standard eller Plus, får I adgang til den samme AI-drevne
              tilbudsgenerator — professionelle tilbud på sekunder, med jeres priser og kundens behov
              som udgangspunkt.
            </p>
          </div>
        </div>
        <Link
          href="/ai-vaerktoejer"
          className="shrink-0 self-start rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:self-center"
        >
          Læs mere
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-6 ${
              plan.highlighted ? "border-green-600 shadow-md" : "border-slate-200"
            }`}
            style={plan.highlighted ? { boxShadow: "0 10px 24px rgba(22, 163, 74, 0.22)" } : undefined}
          >
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p
              className="mt-3 text-3xl font-bold"
              style={plan.highlighted ? { color: "#16A34A" } : undefined}
            >
              {plan.price}
            </p>
            <ul className="mt-5 space-y-2 text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <a
              href={ctaHref}
              className="mt-8 inline-block rounded-full px-5 py-2 font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#1D9E75" }}
            >
              Vælg {plan.name}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
