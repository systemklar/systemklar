import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function CookiepolitikPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#EEF2E6] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold text-[#2C3020]">Cookiepolitik</h1>
            <p className="mt-3 text-lg text-[#5C5A48]">Sidst opdateret: maj 2026</p>
          </div>
        </section>
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">1. Hvad er cookies?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              Cookies er små tekstfiler der gemmes på din enhed når du besøger en hjemmeside. De bruges til at huske
              dine præferencer og forbedre din oplevelse.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">2. Hvilke cookies bruger vi?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">Nødvendige cookies (kan ikke fravalges):</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#5C5A48]">
              <li>Session-cookies til at holde dig logget ind</li>
              <li>Sikkerhedscookies der beskytter mod angreb</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">Præferencecookies (kræver samtykke):</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#5C5A48]">
              <li>Husker dit cookie-samtykke</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              Vi bruger ikke tracking-cookies, annoncecookies eller tredjeparts analyse-cookies.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">3. Sådan administrerer du cookies</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              Du kan til enhver tid trække dit samtykke tilbage ved at klikke "Afvis" i cookie-banneret, eller ved at
              slette cookies i din browsers indstillinger.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">4. Kontakt</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              Spørgsmål til vores cookiebrug? Skriv til kontakt@systemklar.dk
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
