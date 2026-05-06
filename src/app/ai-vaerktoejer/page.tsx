import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
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

function QuoteMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/tilbud" />
      <div className="p-4" style={{ height: "280px" }}>
        <div className="mb-2 text-[10px] text-[#4A8CB5]">Tilbud - VVS serviceaftale</div>
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded bg-sky-100" />
          <div className="h-1.5 w-5/6 rounded bg-sky-100" />
          <div className="h-1.5 w-4/6 rounded bg-sky-100" />
          <div className="h-1.5 w-full rounded bg-sky-100" />
        </div>
        <div className="mt-4 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          Klar til at sende ✓
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
      <BrowserChrome path="systemklar.dk/ai-assistent" />
      <div className="p-4" style={{ height: "280px" }}>
        <div className="mb-3 text-sm font-bold text-[#0D1F2D]">AI-assistent</div>
        <div className="space-y-2">
          <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
            Hvorfor var printeren nede i går?
          </div>
          <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
            Der var papirblokering. Sagen blev løst kl. 10:42.
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
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Rapporten er klar og sendt automatisk.
        </div>
      </div>
    </div>
  );
}

export default function AiVaerktoejerPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-32 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
              AI-værktøjer
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Værktøjer der gør arbejdet for dig
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
              Du behøver ikke forstå teknologi for at bruge dem.
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">TILBUDSGENERATOR</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Tilbud på 2 minutter</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Beskriv hvad kunden skal bruge. Få et professionelt tilbud klar til at sende – uden at bruge en time
                på det.
              </p>
            </div>
            <QuoteMockup />
          </div>
        </section>

        <section className="bg-[#F0F7FF] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <ChatMockup />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">AI-ASSISTENT</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Spørg løs – få svar på dansk</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Stil spørgsmål om din IT og få et svar du faktisk forstår. Ingen teknisk jargon.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">IT-RAPPORT</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0D1F2D]">Din månedlige rapport – automatisk</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">
                Hver måned genereres en rapport over drift, hændelser og anbefalinger. Du skal ikke gøre noget.
              </p>
            </div>
            <ReportMockup />
          </div>
        </section>

        <section className="bg-[#062840] py-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Vil du se det i aktion?</h2>
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
