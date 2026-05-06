import { MarketingShell } from "@/components/marketing/MarketingShell";
import Link from "next/link";

function BrowserChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
      <div className="flex gap-1.5">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-amber-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">{path}</div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/portal" />
      <div className="flex" style={{ height: "280px" }}>
        <div className="flex w-40 flex-col gap-1 border-r border-sky-50 bg-[#F5FAFD] p-3">
          <div className="mb-2 text-xs font-bold text-[#0A6EBD]">systemklar</div>
          <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-700">Overblik</div>
          <div className="px-2 py-1.5 text-xs text-slate-500">Support & sager</div>
          <div className="px-2 py-1.5 text-xs text-slate-500">Kodebank</div>
          <div className="px-2 py-1.5 text-xs text-slate-500">IT-rapport</div>
          <div className="px-2 py-1.5 text-xs text-slate-500">Systemer</div>
        </div>
        <div className="flex-1 bg-white p-4">
          <div className="mb-1 text-sm font-bold text-[#0D1F2D]">Goddag, Møllers VVS</div>
          <div className="mb-3 text-xs text-[#4A8CB5]">Her er dagens overblik.</div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
              <div className="text-sm font-bold text-[#0A6EBD]">3</div>
              <div className="text-[10px] text-[#4A8CB5]">Systemer OK</div>
            </div>
            <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
              <div className="text-sm font-bold text-[#0A6EBD]">1</div>
              <div className="text-[10px] text-[#4A8CB5]">Åben sag</div>
            </div>
            <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
              <div className="text-sm font-bold text-[#0A6EBD]">apr</div>
              <div className="text-[10px] text-[#4A8CB5]">Seneste rapport</div>
            </div>
          </div>
          <div className="mb-2 text-xs font-semibold text-[#0D1F2D]">Seneste sager</div>
          <div className="flex items-center justify-between rounded-lg bg-[#F0F7FF] px-3 py-2">
            <span className="text-xs text-[#2C4A5E]">Printer virker ikke</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Aktiv</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/support" />
      <div className="p-4" style={{ height: "280px" }}>
        <div className="mb-3 text-sm font-bold text-[#0D1F2D]">Support & sager</div>
        <div className="flex flex-col gap-2">
          <div className="max-w-xs self-end rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
            Vores printer printer ikke – det haster lidt
          </div>
          <div className="max-w-xs self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
            Forstået! Vi kigger på det med det samme.
          </div>
          <div className="max-w-xs self-end rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
            Kan I sende guide?
          </div>
          <div className="max-w-xs self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
            Trin-for-trin guide er sendt til din mail nu.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/rapport" />
      <div className="p-4" style={{ height: "280px" }}>
        <div className="mb-1 text-sm font-bold text-[#0D1F2D]">IT-rapport – april 2026</div>
        <div className="mb-3 text-xs text-[#4A8CB5]">Møllers VVS</div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-green-50 p-2 text-center">
            <div className="text-sm font-bold text-green-700">100%</div>
            <div className="text-[10px] text-green-600">Oppetid</div>
          </div>
          <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
            <div className="text-sm font-bold text-[#0A6EBD]">3</div>
            <div className="text-[10px] text-[#4A8CB5]">Løste sager</div>
          </div>
          <div className="rounded-lg bg-[#F0F7FF] p-2 text-center">
            <div className="text-sm font-bold text-[#0A6EBD]">0</div>
            <div className="text-[10px] text-[#4A8CB5]">Åbne sager</div>
          </div>
        </div>
        <div className="mb-1.5 text-xs font-semibold text-[#0D1F2D]">Anbefaling</div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Opdater Windows på 2 maskiner inden næste måned.
        </div>
      </div>
    </div>
  );
}

function VaultMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/kodebank" />
      <div className="p-4" style={{ height: "280px" }}>
        <div className="mb-3 text-sm font-bold text-[#0D1F2D]">Kodebank</div>
        <div className="space-y-2">
          {["Microsoft 365", "Dinero", "e-Boks"].map((row) => (
            <div key={row} className="flex items-center justify-between rounded-lg bg-[#F0F7FF] px-3 py-2">
              <span className="text-xs text-[#2C4A5E]">{row}</span>
              <span className="text-xs tracking-wider text-[#4A8CB5]">••••••••</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlatformenPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-32 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
              Platformen
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Alt hvad din virksomhed har brug for – samlet ét sted
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
              Ingen rodede systemer. Ingen forvirring. Bare overblik.
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">OVERBLIK</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Se status på alt med ét klik</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Du logger ind og ser med det samme om alt kører. Er der et problem, står det tydeligt – uden at du
                skal lede.
              </p>
            </div>
            <DashboardMockup />
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <ChatMockup />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">SUPPORT</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Få hjælp uden at ringe rundt</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Opret en sag direkte i systemet. Vi svarer hurtigt, og du kan følge status hele vejen.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">IT-RAPPORT</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">En månedlig rapport du faktisk forstår</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Ingen teknisk snak. Du får en kort oversigt over hvad der er sket, hvad vi har løst, og hvad du bør
                gøre.
              </p>
            </div>
            <ReportMockup />
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <VaultMockup />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">KODEBANK</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Adgangskoder samlet – aldrig væk</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Gem logins og passwords sikkert ét sted. Du og dit team kan altid finde det I har brug for.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#062840] py-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Klar til at prøve platformen?</h2>
            <Link
              href="/book-demo"
              className="mt-8 inline-flex rounded-full bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
            >
              Book gratis demo
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
