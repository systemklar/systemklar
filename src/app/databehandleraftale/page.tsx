import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function DatabehandleraftalePage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#EEF2E6] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold text-[#2C3020]">Databehandleraftale (DPA)</h1>
            <p className="mt-3 text-lg text-[#5C5A48]">
              Gælder for alle kunder der behandler personoplysninger via systemklar
            </p>
          </div>
        </section>
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">1. Parter</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">Denne databehandleraftale er indgået mellem:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#5C5A48]">
              <li>Dataansvarlig: Den virksomhed der har oprettet en konto hos systemklar</li>
              <li>Databehandler: systemklar · CVR 46431596 · kontakt@systemklar.dk</li>
            </ul>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">2. Formål</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              systemklar behandler personoplysninger på vegne af den dataansvarlige i forbindelse med levering af
              IT-platformens funktioner.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">3. Typer af personoplysninger</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              systemklar behandler følgende kategorier på vegne af kunden:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#5C5A48]">
              <li>Navne og kontaktoplysninger på slutbrugere</li>
              <li>Supporthenvendelser og kommunikation</li>
              <li>IT-systemoplysninger tilknyttet kundens konto</li>
            </ul>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">4. Behandlingens varighed</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              Aftalen gælder så længe kunden har en aktiv konto hos systemklar.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">5. Underdatabehandlere</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              systemklar anvender følgende underdatabehandlere:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[#5C5A48]">
              <li>Supabase Inc. (database, EU-region)</li>
              <li>Resend Inc. (e-mail)</li>
              <li>Netlify Inc. (hosting)</li>
            </ul>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">6. Sikkerhed</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              systemklar træffer passende tekniske og organisatoriske foranstaltninger for at beskytte personoplysninger
              mod uautoriseret adgang, tab eller ødelæggelse.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">7. Den registreredes rettigheder</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">
              systemklar bistår den dataansvarlige med at opfylde den registreredes rettigheder i henhold til GDPR
              kapitel III.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#2C3020]">8. Kontakt</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#5C5A48]">kontakt@systemklar.dk</p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
