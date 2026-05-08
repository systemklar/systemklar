import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CheckCircle } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export const metadata: Metadata = {
  title: "AI-værktøjer – systemklar",
  description:
    "Tilbud på 2 minutter, AI-assistent og automatisk IT-rapport. Værktøjer der gør arbejdet for dig.",
  openGraph: {
    title: "AI-værktøjer – systemklar",
    description: "Tilbud på 2 minutter, AI-assistent og automatisk IT-rapport.",
    url: "https://systemklar.dk/ai-vaerktoejer",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

function FeatureCopy({
  label,
  title,
  description,
  features,
}: {
  label: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">{label}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-[#2C4A5E]">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[#0D1F2D]">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockupShell({ children }: { children: ReactNode }) {
  return (
    <div className="cursor-default rounded-2xl border border-white/10 bg-[#062840] p-6 text-white shadow-xl transition-transform duration-500 hover:scale-[1.02]">
      {children}
    </div>
  );
}

const quoteLines: Array<[string, string]> = [
  ["Månedlig IT-support", "1.299 kr."],
  ["Systemovervågning", "299 kr."],
  ["Kodebank adgang", "99 kr."],
];

function QuoteMockup() {
  return (
    <MockupShell>
      <div
        className="mb-3 text-xs font-medium text-white/50"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.1s both" }}
      >
        AI Tilbudsgenerator
      </div>
      <div
        className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.2s both" }}
      >
        Kunden har brug for IT-support aftale, 5 ansatte, månedlig...
      </div>
      <div
        className="rounded-xl bg-white/10 p-4"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.3s both" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold">Tilbud – IT Serviceaftale</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
            <CheckCircle className="h-2.5 w-2.5" aria-hidden />
            Klar til at sende
          </span>
        </div>
        {quoteLines.map(([item, price]) => (
          <div
            key={item}
            className="flex justify-between border-b border-white/5 py-1.5 text-[11px] text-white/70"
          >
            <span>{item}</span>
            <span className="text-white">{price}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between text-xs font-semibold text-white">
          <span>Total/md.</span>
          <span className="text-sky-400">1.697 kr.</span>
        </div>
      </div>
      <div
        className="mt-3 flex items-center gap-1"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.4s both" }}
      >
        <div
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"
          style={{ animationDelay: "300ms" }}
        />
        <span className="ml-1 text-[10px] text-white/40">AI genererer...</span>
      </div>
    </MockupShell>
  );
}

const chatMessages: Array<{ from: "user" | "ai"; text: string }> = [
  {
    from: "user",
    text: 'Hvad betyder det at vores backup-system har status "advarsel"?',
  },
  {
    from: "ai",
    text: "Det betyder at backup'en kørte, men der var mindre fejl – typisk at nogle filer ikke blev inkluderet. Det er ikke kritisk endnu, men bør tjekkes inden for de næste dage.",
  },
  {
    from: "user",
    text: "Skal jeg oprette en sag?",
  },
  {
    from: "ai",
    text: "Ja, det vil jeg anbefale. Vil du have at jeg opretter en sag til dig nu?",
  },
];

function ChatMockup() {
  return (
    <MockupShell>
      <div
        className="mb-4 text-xs font-medium text-white/50"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.1s both" }}
      >
        AI-assistent
      </div>
      <div className="space-y-3">
        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            style={{ animation: `mockupFadeIn 0.4s ease-out ${0.2 + i * 0.12}s both` }}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.from === "user"
                  ? "rounded-tr-sm bg-sky-600 text-white"
                  : "rounded-tl-sm bg-white/10 text-white/90"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.7s both" }}
      >
        <span className="text-xs text-white/30">Skriv et spørgsmål...</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </MockupShell>
  );
}

const reportStats: Array<{ value: string; label: string; tone: "ok" | "info" }> = [
  { value: "100%", label: "Oppetid", tone: "ok" },
  { value: "3", label: "Løste sager", tone: "info" },
  { value: "0", label: "Åbne sager", tone: "info" },
];

function ReportMockup() {
  return (
    <MockupShell>
      <div
        className="mb-4 flex items-start justify-between"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.1s both" }}
      >
        <div>
          <div className="text-sm font-semibold text-white">IT-rapport – april 2026</div>
          <div className="mt-0.5 text-[10px] text-white/50">Møllers VVS · Genereret 1. maj</div>
        </div>
        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
          PDF klar
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {reportStats.map((s, i) => (
          <div
            key={s.label}
            className={`rounded-xl border p-3 text-center ${
              s.tone === "ok"
                ? "border-green-400/20 bg-green-500/10 text-green-300"
                : "border-white/10 bg-white/5 text-sky-300"
            }`}
            style={{ animation: `mockupFadeIn 0.4s ease-out ${0.2 + i * 0.1}s both` }}
          >
            <div className="text-base font-bold">{s.value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-80">{s.label}</div>
          </div>
        ))}
      </div>
      <div
        className="mb-2 text-xs font-semibold text-white"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.5s both" }}
      >
        Anbefaling til næste måned
      </div>
      <div
        className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.6s both" }}
      >
        Opdater Windows på 2 maskiner inden næste måned for fortsat sikkerhed.
      </div>
      <div
        className="mt-3 flex items-center justify-between text-[10px] text-white/40"
        style={{ animation: "mockupFadeIn 0.4s ease-out 0.7s both" }}
      >
        <span>Historik tilbage til januar</span>
        <span>Næste rapport: 1. juni</span>
      </div>
    </MockupShell>
  );
}

const blocks = [
  {
    bg: "bg-[#F5FAFD]",
    textFirst: true,
    label: "TILBUDSGENERATOR",
    title: "Tilbud på 2 minutter",
    description:
      "Beskriv hvad kunden skal bruge. Få et professionelt tilbud klar til at sende – uden at bruge en time på det.",
    features: [
      "Beskriv kundens behov i fri tekst",
      "AI genererer færdigt tilbud med priser",
      "Rediger og tilpas inden du sender",
      "Send direkte til kundens email",
    ],
    Mockup: QuoteMockup,
  },
  {
    bg: "bg-white",
    textFirst: false,
    label: "AI-ASSISTENT",
    title: "Spørg løs – få svar på dansk",
    description:
      "Stil spørgsmål om din IT og få et svar du faktisk forstår. Ingen teknisk jargon, bare klare svar.",
    features: [
      "Stil spørgsmål i fri tekst på dansk",
      "Svar baseret på dine egne systemer og sager",
      "Forklarer tekniske begreber simpelt",
      "Tilgængelig når du har brug for det",
    ],
    Mockup: ChatMockup,
  },
  {
    bg: "bg-[#F5FAFD]",
    textFirst: true,
    label: "AUTOMATISK RAPPORT",
    title: "Din månedlige rapport – uden du løfter en finger",
    description:
      "Hver måned genereres en rapport over drift, hændelser og anbefalinger. Du får en email når den er klar.",
    features: [
      "Genereres automatisk hver måned",
      "Oppetid, løste sager og anbefalinger",
      "Forklaret i plain dansk – ikke teknisk",
      "Du får besked på email når den er klar",
    ],
    Mockup: ReportMockup,
  },
];

export default function AiVaerktoejerPage() {
  return (
    <MarketingShell>
      <main>
        <style>{`
          @keyframes mockupFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-20 pt-32 md:py-32 md:pt-40">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              AI-værktøjer
            </p>
            <AnimatedSection direction="up">
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Værktøjer der gør arbejdet for dig
              </h1>
            </AnimatedSection>
            <AnimatedSection direction="up" delay={100}>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
                Du behøver ikke forstå teknologi for at bruge dem.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {blocks.map((block) => {
          const { Mockup, textFirst, bg, label, title, description, features } = block;
          return (
            <section key={label} className={`${bg} py-16 md:py-24`}>
              <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:gap-12 lg:grid-cols-2">
                <AnimatedSection
                  direction={textFirst ? "left" : "right"}
                  className={textFirst ? "lg:order-1" : "lg:order-2"}
                >
                  <FeatureCopy label={label} title={title} description={description} features={features} />
                </AnimatedSection>
                <AnimatedSection
                  direction={textFirst ? "right" : "left"}
                  className={`hidden md:block ${textFirst ? "lg:order-2" : "lg:order-1"}`}
                >
                  <Mockup />
                </AnimatedSection>
              </div>
            </section>
          );
        })}

      </main>
    </MarketingShell>
  );
}
