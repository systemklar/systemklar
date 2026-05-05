import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function PriserPage() {
  return (
    <MarketingShell>
      <main className="bg-white pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
          <p className="inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-4 py-2 text-sm font-medium text-[#6B6B6B]">
            Transparent prissætning
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-5xl md:leading-tight">
            Priser der passer til jeres virksomhed
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-500">
            Alle planer inkluderer{" "}
            <strong className="font-semibold text-[#0A0A0A]">AI Tilbudsgenerator</strong>. Se også{" "}
            <Link href="/ai-vaerktoejer" className="font-semibold text-[#2563EB] underline-offset-2 hover:underline">
              øvrige AI-værktøjer
            </Link>
            .
          </p>
        </div>
        <PricingSection sectionId="priser" ctaHref="/book-demo" />

        <section className="mx-auto max-w-6xl px-6 pb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] md:text-3xl">Sammenligning</h2>
          <p className="mt-2 text-[#6B6B6B]">Sammenlign planer og vælg det niveau, der passer bedst.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F7F7F5]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-[#0A0A0A]">Funktion</th>
                  <th className="px-5 py-4 font-semibold text-[#0A0A0A]">Basis</th>
                  <th className="px-5 py-4 font-semibold text-[#0A0A0A]">Standard</th>
                  <th className="border-l-2 border-[#2563EB] bg-[#EFF6FF]/50 px-5 py-4 font-semibold text-[#2563EB]">
                    Plus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["IT-overblik", "✓", "✓", "✓"],
                  ["Support & sager", "✓", "✓", "✓"],
                  ["AI Tilbudsgenerator", "✓", "✓", "✓"],
                  ["Prioriteret support", "–", "✓", "✓"],
                  ["Månedlig IT-rapport", "–", "✓", "✓"],
                  ["AI-assistent", "–", "–", "✓"],
                  ["Dedikeret onboarding", "–", "–", "✓"],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-[#F7F7F5]/80">
                    <td className="px-5 py-3.5 font-medium text-[#0A0A0A]">{row[0]}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{row[1]}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{row[2]}</td>
                    <td className="border-l-2 border-[#2563EB] px-5 py-3.5 font-medium text-[#2563EB]">{row[3]}</td>
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
