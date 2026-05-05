import { ContactForm } from "@/components/marketing/ContactForm";
import { MarketingContactAside } from "@/components/marketing/MarketingContactAside";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingSubpageHero } from "@/components/marketing/MarketingSubpageHero";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export default function KontaktPage() {
  return (
    <MarketingShell>
      <main className="bg-white pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
          <MarketingSubpageHero
            title="Kontakt"
            description="Har I spørgsmål til platformen, priser eller en demo? Skriv eller ring — vi hjælper gerne."
          />
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-12 px-6 md:mt-20 lg:grid-cols-12 lg:items-start">
          <ScrollReveal className="lg:col-span-7" staggerMs={0}>
            <ContactForm />
          </ScrollReveal>
          <ScrollReveal className="lg:col-span-5" staggerMs={100}>
            <div className="lg:sticky lg:top-28">
              <MarketingContactAside concise={false} />
            </div>
          </ScrollReveal>
        </div>
      </main>
    </MarketingShell>
  );
}
