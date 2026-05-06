import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function CookiepolitikPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#F0F7FF] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold text-[#0D1F2D]">Cookiepolitik</h1>
            <p className="mt-3 text-lg text-[#2C4A5E]">Sidst opdateret: maj 2026</p>
          </div>
        </section>
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#0D1F2D]">1. Hvad er cookies?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">
              Cookies er små tekstfiler der gemmes på din enhed når du besøger en hjemmeside. De bruges til at huske
              dine præferencer og forbedre din oplevelse.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#0D1F2D]">2. Hvilke cookies bruger vi?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">Nødvendige cookies (kan ikke fravalges):</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#2C4A5E]">
              <li>Session-cookies til at holde dig logget ind</li>
              <li>Sikkerhedscookies der beskytter mod angreb</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">Præferencecookies (kræver samtykke):</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#2C4A5E]">
              <li>Husker dit cookie-samtykke</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">
              Vi bruger ikke tracking-cookies, annoncecookies eller tredjeparts analyse-cookies.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#0D1F2D]">3. Sådan administrerer du cookies</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">
              Du kan til enhver tid trække dit samtykke tilbage ved at klikke "Afvis" i cookie-banneret, eller ved at
              slette cookies i din browsers indstillinger.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#0D1F2D]">4. Kontakt</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#2C4A5E]">
              Spørgsmål til vores cookiebrug? Skriv til kontakt@systemklar.dk
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
