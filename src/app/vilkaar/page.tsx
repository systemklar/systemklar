import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function VilkaarPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#EAF1F7] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold text-[#1E3448]">Vilkår og betingelser</h1>
            <p className="mt-3 text-lg text-[#4A6478]">Sidst opdateret: maj 2026 · Gælder fra første login</p>
          </div>
        </section>
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">1. Accept af vilkår</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Ved at oprette en konto hos systemklar accepterer du disse vilkår. Hvis du ikke accepterer vilkårene, må
              du ikke bruge platformen.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">2. Om tjenesten</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              systemklar er en abonnementsbaseret IT-platform til virksomheder. Vi forbeholder os retten til at ændre,
              opdatere eller afbryde tjenesten med rimeligt varsel.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">3. Din konto</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Du er ansvarlig for at holde dine loginoplysninger fortrolige. Du må ikke dele din konto med andre eller
              oprette konti på vegne af tredjepart uden aftale.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">4. Betaling og abonnement</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Abonnementet faktureres månedligt forud. Du kan opsige når som helst – opsigelse træder i kraft ved
              udgangen af indeværende betalingsperiode. Der gives ikke refusion for påbegyndte perioder.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">5. Ansvarsbegrænsning</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              systemklar stræber efter høj oppetid men garanterer ikke fejlfri drift. Vi er ikke ansvarlige for tab
              som følge af driftsforstyrrelser, datatab eller uvedkommendes adgang, medmindre dette skyldes grov
              uagtsomhed fra vores side.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">6. Intellektuel ejendomsret</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Alt indhold på platformen tilhører systemklar og må ikke kopieres eller videredistribueres uden
              tilladelse. Dine egne data tilhører dig.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">7. Lovvalg og værneting</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              Disse vilkår er underlagt dansk ret. Tvister afgøres ved de danske domstole.
            </p>

            <h2 className="mb-3 mt-10 text-xl font-semibold text-[#1E3448]">8. Kontakt</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#4A6478]">
              systemklar · kontakt@systemklar.dk · CVR 46431596
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
