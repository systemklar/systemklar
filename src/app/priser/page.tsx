import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingSection } from "@/components/marketing/PricingSection";

const comparisonRows: [string, string, string, string][] = [
  ["IT-overblik", "✓", "✓", "✓"],
  ["Support & sager", "✓", "✓", "✓"],
  ["AI Tilbudsgenerator", "✓", "✓", "✓"],
  ["Prioriteret support", "–", "✓", "✓"],
  ["Månedlig IT-rapport", "–", "✓", "✓"],
  ["AI-assistent", "–", "–", "✓"],
  ["Dedikeret onboarding", "–", "–", "✓"],
];

export default function PriserPage() {
  return (
    <MarketingShell>
      <main className="bg-white pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6 pt-20 text-center md:pt-28">
          <h1 className="text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-6xl md:leading-[1.05]">
            Enkle, transparente priser
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#6B6B6B] md:text-xl">
            Vælg den plan der passer til jer. Ingen skjulte gebyrer.
          </p>
        </div>

        <div className="mt-16 md:mt-24">
          <PricingSection sectionId="priser" ctaHref="/book-demo" />
        </div>

        <section className="mx-auto mt-24 max-w-6xl px-6 md:mt-32">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">Sammenligning</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-4 pr-4 font-medium text-[#6B6B6B]">Funktion</th>
                  <th className="pb-4 px-4 font-medium text-[#0A0A0A]">Basis</th>
                  <th className="pb-4 px-4 font-medium text-[#0A0A0A]">Standard</th>
                  <th className="pb-4 pl-4 font-medium text-[#2563EB]">Plus</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, b, s, p]) => (
                  <tr key={label} className="border-b border-gray-100">
                    <td className="py-4 pr-4 font-medium text-[#0A0A0A]">{label}</td>
                    <td className="py-4 px-4 text-[#6B6B6B]">{b}</td>
                    <td className="py-4 px-4 text-[#6B6B6B]">{s}</td>
                    <td className="py-4 pl-4 text-[#0A0A0A]">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
