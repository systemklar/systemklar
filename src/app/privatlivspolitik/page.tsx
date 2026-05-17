import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function PrivatlivspolitikPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#EAF1F7] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold text-[#1E3448]">Privatlivspolitik</h1>
            <p className="mt-3 text-lg text-[#4A6478]">Sidst opdateret: maj 2026</p>
          </div>
        </section>
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">1. Hvem er vi?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              systemklar er en IT-platform til små og mellemstore virksomheder i Danmark. Virksomhed: systemklar · CVR:
              46431596 · kontakt@systemklar.dk · systemklar.dk
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">2. Hvilke oplysninger indsamler vi?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Når du opretter en konto eller bruger platformen, indsamler vi:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#4A6478]">
              <li>Navn og e-mailadresse</li>
              <li>Virksomhedsnavn</li>
              <li>Supporthenvendelser og beskeder du sender os</li>
              <li>Oplysninger om IT-systemer du tilføjer i platformen</li>
              <li>Login-oplysninger (adgangskoder gemmes krypteret via Supabase Auth)</li>
            </ul>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">3. Hvorfor behandler vi dine oplysninger?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">Vi behandler dine oplysninger for at:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#4A6478]">
              <li>Oprette og administrere din konto</li>
              <li>Levere platformens funktioner (support, overblik, rapporter)</li>
              <li>Sende dig relevante beskeder og notifikationer</li>
              <li>Forbedre og videreudvikle platformen</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Retsgrundlag: Opfyldelse af aftale (GDPR art. 6, stk. 1, litra b) og legitim interesse (litra f).
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">4. Deler vi dine oplysninger?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Vi deler ikke dine personoplysninger med tredjepart til markedsføring. Vi anvender følgende
              databehandlere:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#4A6478]">
              <li>Supabase (database og autentificering) – servere i EU</li>
              <li>Resend (e-maillevering) – til transaktionelle emails</li>
              <li>Netlify (hosting) – til levering af platformen</li>
            </ul>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">5. Hvor længe gemmer vi dine oplysninger?</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Vi gemmer dine oplysninger så længe din konto er aktiv. Ved opsigelse sletter vi dine data inden for 90
              dage, medmindre lovgivning kræver længere opbevaring.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">6. Dine rettigheder</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">Du har ret til at:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#4A6478]">
              <li>Få indsigt i hvilke oplysninger vi har om dig</li>
              <li>Få rettet ukorrekte oplysninger</li>
              <li>Få slettet dine oplysninger</li>
              <li>Gøre indsigelse mod behandlingen</li>
              <li>Modtage dine data i et maskinlæsbart format</li>
            </ul>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Kontakt os på kontakt@systemklar.dk for at udøve dine rettigheder. Du kan også klage til Datatilsynet:
              dt.dk
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">7. Kontakt</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              systemklar · kontakt@systemklar.dk · CVR 46431596
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
