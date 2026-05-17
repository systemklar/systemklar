import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle,
  ChevronRight,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Server,
  Tag,
  UserPlus,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Platformen – systemklar",
  description:
    "Se alt hvad systemklar kan gøre for din virksomhed. Overblik, support, kodebank, IT-rapport og teamadgang samlet ét sted.",
  openGraph: {
    title: "Platformen – systemklar",
    description: "Alt hvad din virksomhed har brug for – samlet ét sted.",
    url: "https://systemklar.dk/platformen",
    siteName: "systemklar",
    locale: "da_DK",
    type: "website",
  },
};

function BrowserChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#C8D8E4] bg-[#EAF1F7] px-4 py-2.5">
      <div className="flex gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 rounded-full bg-white px-3 py-0.5 text-xs text-[#4A6478]">{path}</div>
    </div>
  );
}

function MockupCard({ children }: { children: ReactNode }) {
  return (
    <div className="cursor-default overflow-hidden rounded-2xl border border-[#C8D8E4] bg-white shadow-xl transition-transform duration-500 hover:scale-[1.02]">
      {children}
    </div>
  );
}

function Sidebar({ active }: { active: string }) {
  const items = [
    { label: "Overblik", icon: LayoutDashboard },
    { label: "Support & sager", icon: MessageCircle },
    { label: "Kodebank", icon: KeyRound },
    { label: "IT-rapport", icon: FileText },
    { label: "Systemer", icon: Server },
  ];
  return (
    <div className="flex w-36 shrink-0 flex-col gap-1 border-r border-[#E0EAF0] bg-[#F7F4EF] p-3">
      <div className="mb-2 px-1 text-[10px] font-bold text-[#4A7FA5]">systemklar</div>
      {items.map(({ label, icon: Icon }) => {
        const isActive = active === label;
        return (
          <div
            key={label}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${
              isActive ? "bg-[#EAF1F7] font-medium text-[#3A6F95]" : "text-slate-400"
            }`}
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const dashboardStats: Array<{ value: string; label: string; cls: string }> = [
  { value: "3", label: "Systemer OK", cls: "bg-green-50 text-green-700" },
  { value: "1", label: "Åben sag", cls: "bg-amber-50 text-amber-700" },
  { value: "apr", label: "Rapport", cls: "bg-[#EAF1F7] text-[#3A6F95]" },
];

const dashboardCases: Array<{ title: string; status: string; cls: string }> = [
  { title: "Printer virker ikke", status: "Aktiv", cls: "bg-amber-100 text-amber-700" },
  { title: "E-mail virker ikke", status: "Løst", cls: "bg-green-100 text-green-700" },
];

function DashboardMockup() {
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/portal" />
      <div className="flex" style={{ minHeight: "320px" }}>
        <Sidebar active="Overblik" />
        <div className="flex-1 bg-white p-5">
          <div className="mb-0.5 text-sm font-bold text-[#1E3448]">Goddag, Møllers VVS</div>
          <div className="mb-4 text-xs text-[#4A6478]">Onsdag den 7. maj 2026</div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {dashboardStats.map((stat, i) => (
              <div
                key={stat.label}
                className={`rounded-xl p-2.5 text-center ${stat.cls}`}
                style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.1}s both` }}
              >
                <div className="text-base font-bold">{stat.value}</div>
                <div className="mt-0.5 text-[10px]">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mb-2 text-xs font-semibold text-[#1E3448]">Seneste sager</div>
          {dashboardCases.map((c, i) => (
            <div
              key={c.title}
              className="mb-1.5 flex items-center justify-between rounded-lg bg-[#EAF1F7] px-3 py-2"
              style={{ animation: `mockupFadeIn 0.4s ease-out ${0.3 + i * 0.1}s both` }}
            >
              <span className="text-xs text-[#4A6478]">{c.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.cls}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupCard>
  );
}

const supportMessages: Array<{ from: "user" | "support"; text: string }> = [
  { from: "user", text: "Vores printer printer ikke – det haster lidt før vi skal sende fakturaer." },
  { from: "support", text: "Forstået! Jeg kigger på det med det samme. Hvilken model er det?" },
  { from: "user", text: "Det er en HP LaserJet på kontoret. Kan I sende en guide?" },
  { from: "support", text: "Trin-for-trin guide er sendt til din mail. Vi følger op om en time." },
];

function SupportMockup() {
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/support" />
      <div className="bg-white" style={{ minHeight: "320px" }}>
        <div className="border-b border-[#E0EAF0] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-[#1E3448]">Sag #1284 – Printer virker ikke</div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Aktiv
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#4A6478]">Oprettet for 12 minutter siden · 2 svar</div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {supportMessages.map((m, i) => (
            <div
              key={i}
              className={`max-w-xs rounded-2xl px-3 py-2 text-xs ${
                m.from === "user"
                  ? "self-end rounded-tr-sm bg-[#4A7FA5] text-white"
                  : "self-start rounded-tl-sm bg-[#EAF1F7] text-[#4A6478]"
              }`}
              style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.15}s both` }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="border-t border-[#E0EAF0] p-3">
          <div className="flex items-center gap-2 rounded-full border border-[#C8D8E4] bg-[#F8FCFF] px-3 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-[#4A6478]" />
            <span className="flex-1 text-xs text-[#4A6478]">Skriv en besked …</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4A7FA5]">
              <Send className="h-3 w-3 text-white" />
            </span>
          </div>
        </div>
      </div>
    </MockupCard>
  );
}

function ReportMockup() {
  const stats: Array<{ value: string; label: string; cls: string }> = [
    { value: "100%", label: "Oppetid", cls: "bg-green-50 text-green-700" },
    { value: "3", label: "Løste sager", cls: "bg-[#EAF1F7] text-[#3A6F95]" },
    { value: "0", label: "Åbne sager", cls: "bg-[#EAF1F7] text-[#3A6F95]" },
  ];
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/rapport" />
      <div className="bg-white p-5" style={{ minHeight: "320px" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold text-[#1E3448]">IT-rapport – april 2026</div>
            <div className="mt-0.5 text-xs text-[#4A6478]">Møllers VVS · Genereret 1. maj</div>
          </div>
          <span className="rounded-full bg-[#EAF1F7] px-2 py-0.5 text-[10px] font-medium text-[#3A6F95]">PDF klar</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`rounded-xl p-3 text-center ${s.cls}`}
              style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.1}s both` }}
            >
              <div className="text-base font-bold">{s.value}</div>
              <div className="mt-0.5 text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 mb-1.5 text-xs font-semibold text-[#1E3448]">Anbefaling til næste måned</div>
        <div
          className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          style={{ animation: "mockupFadeIn 0.4s ease-out 0.3s both" }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Opdater Windows på 2 maskiner inden næste måned for fortsat sikkerhed.</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-[#4A6478]">
          <span className="inline-flex items-center gap-1">
            <History className="h-3 w-3" />
            Historik tilbage til januar
          </span>
          <span>Næste rapport: 1. juni</span>
        </div>
      </div>
    </MockupCard>
  );
}

const vaultEntries: Array<{ name: string; category: string }> = [
  { name: "Microsoft 365", category: "Produktivitet" },
  { name: "Dinero", category: "Bogføring" },
  { name: "e-Boks", category: "Offentligt" },
  { name: "Nets", category: "Bank" },
];

function VaultMockup() {
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/kodebank" />
      <div className="bg-white p-5" style={{ minHeight: "320px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-[#1E3448]">Kodebank</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
            <Lock className="h-3 w-3" />
            Krypteret
          </span>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#C8D8E4] bg-[#F8FCFF] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[#4A6478]" />
          <span className="flex-1 text-xs text-[#4A6478]">Søg på navn, kategori eller URL …</span>
        </div>
        <div className="space-y-2">
          {vaultEntries.map((entry, i) => (
            <div
              key={entry.name}
              className="flex items-center justify-between rounded-lg bg-[#EAF1F7] px-3 py-2"
              style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.08}s both` }}
            >
              <div>
                <div className="text-xs font-semibold text-[#1E3448]">{entry.name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#4A6478]">
                  <Tag className="h-2.5 w-2.5" />
                  {entry.category}
                </div>
              </div>
              <span className="text-xs tracking-wider text-[#4A6478]">••••••••</span>
            </div>
          ))}
        </div>
      </div>
    </MockupCard>
  );
}

const STATUS_STYLES = {
  ok: { dot: "bg-green-500", badge: "bg-green-100 text-green-700", label: "OK" },
  warn: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700", label: "Advarsel" },
  down: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", label: "Nede" },
} as const;

const systems: Array<{ name: string; type: string; status: keyof typeof STATUS_STYLES }> = [
  { name: "Microsoft 365", type: "Cloud", status: "ok" },
  { name: "e-conomic", type: "Software", status: "ok" },
  { name: "Office printer", type: "Netværk", status: "warn" },
  { name: "Backup-server", type: "Server", status: "ok" },
];

function SystemsMockup() {
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/systemer" />
      <div className="bg-white p-5" style={{ minHeight: "320px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-[#1E3448]">Systemer</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF1F7] px-2 py-0.5 text-[10px] font-medium text-[#3A6F95]">
            <Activity className="h-3 w-3" />
            Live overvågning
          </span>
        </div>
        <div className="space-y-2">
          {systems.map((sys, i) => {
            const cfg = STATUS_STYLES[sys.status];
            return (
              <div
                key={sys.name}
                className="flex items-center justify-between rounded-lg border border-[#C8D8E4] bg-[#F8FCFF] px-3 py-2.5"
                style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.1}s both` }}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} aria-hidden />
                  <div>
                    <div className="text-xs font-semibold text-[#1E3448]">{sys.name}</div>
                    <div className="text-[10px] text-[#4A6478]">{sys.type}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#4A6478]">
          <Bell className="h-3 w-3" />
          Du får besked på e-mail hvis status ændrer sig
        </div>
      </div>
    </MockupCard>
  );
}

const teamMembers: Array<{ name: string; role: string; initials: string; cls: string }> = [
  { name: "Benjamin Sørensen", role: "Administrator", initials: "BS", cls: "bg-[#4A7FA5] text-white" },
  { name: "Maria Larsen", role: "Medlem", initials: "ML", cls: "bg-[#EAF1F7] text-[#3A6F95]" },
  { name: "Jens Kristensen", role: "Medlem", initials: "JK", cls: "bg-[#EAF1F7] text-[#3A6F95]" },
];

function TeamMockup() {
  return (
    <MockupCard>
      <BrowserChrome path="systemklar.dk/team" />
      <div className="bg-white p-5" style={{ minHeight: "320px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-[#1E3448]">Team</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF1F7] px-2 py-0.5 text-[10px] font-medium text-[#3A6F95]">
            <Building2 className="h-3 w-3" />
            Møllers VVS
          </span>
        </div>
        <div className="space-y-2">
          {teamMembers.map((m, i) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-lg border border-[#C8D8E4] bg-[#F8FCFF] px-3 py-2.5"
              style={{ animation: `mockupFadeIn 0.4s ease-out ${i * 0.1}s both` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${m.cls}`}
                >
                  {m.initials}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1E3448]">{m.name}</div>
                  <div className="text-[10px] text-[#4A6478]">{m.role}</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#4A6478]" />
            </div>
          ))}
        </div>
        <button
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#C8D8E4] px-3 py-2 text-xs font-medium text-[#4A7FA5]"
          style={{ animation: "mockupFadeIn 0.4s ease-out 0.4s both" }}
        >
          <UserPlus className="h-3 w-3" />
          Inviter en kollega
        </button>
      </div>
    </MockupCard>
  );
}

type FeaturePoint = string;

function FeatureCopy({
  label,
  title,
  description,
  points,
}: {
  label: string;
  title: string;
  description: string;
  points: FeaturePoint[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4A7FA5]">{label}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#1E3448] md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-[#4A6478]">{description}</p>
      <ul className="mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-[#1E3448]">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4A7FA5]" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const blocks = [
  {
    bg: "bg-white",
    textFirst: true,
    label: "Overblik",
    title: "Se status på alt – med ét klik",
    description:
      "Log ind og se med det samme om alle systemer kører, om der er åbne sager, og hvad der er sket siden sidst. Ingen gætteri, ingen søgen.",
    points: [
      "Live status på alle dine IT-systemer",
      "Seneste supportsager og deres status",
      "Besked med det samme hvis noget går ned",
      "Månedlig rapport klar til gennemsyn",
    ],
    Mockup: DashboardMockup,
  },
  {
    bg: "bg-[#EAF1F7]",
    textFirst: false,
    label: "Support",
    title: "Få hjælp uden at ringe rundt",
    description:
      "Opret en sag direkte i platformen. Du kan følge status, chatte med os, og vedhæfte filer – alt samlet ét sted. Ingen ventemusik, ingen forvirring.",
    points: [
      "Opret sag på under 1 minut",
      "Realtids chat med supportteamet",
      "Vedhæft skærmbilleder og filer",
      "Følg status hele vejen til løsning",
    ],
    Mockup: SupportMockup,
  },
  {
    bg: "bg-white",
    textFirst: true,
    label: "IT-rapport",
    title: "En månedlig rapport du faktisk forstår",
    description:
      "Ingen teknisk jargon. Hver måned får du en overskuelig rapport med hvad der er sket, hvad vi har løst, og hvad du bør gøre nu.",
    points: [
      "Oppetid og systemstatus for måneden",
      "Oversigt over løste og åbne sager",
      "Konkrete anbefalinger til næste måned",
      "Historik tilbage i tid",
    ],
    Mockup: ReportMockup,
  },
  {
    bg: "bg-[#EAF1F7]",
    textFirst: false,
    label: "Kodebank",
    title: "Alle passwords samlet – aldrig væk",
    description:
      "Stop med at søge efter adgangskoder i emails og noter. Gem logins sikkert i systemklar – krypteret, tilgængeligt for hele teamet.",
    points: [
      "Krypteret opbevaring af logins",
      "Søg på navn, kategori eller URL",
      "Del sikkert med teamet",
      "Kategorier: Microsoft, Google, bank, og mere",
    ],
    Mockup: VaultMockup,
  },
  {
    bg: "bg-white",
    textFirst: true,
    label: "Systemovervågning",
    title: "Du ved altid om dine systemer kører",
    description:
      "Tilføj dine IT-systemer og følg status live. Hvis noget går ned, får du besked med det samme – inden dine kunder opdager det.",
    points: [
      "Tilføj cloud, server, netværk og software",
      "Live status: OK, advarsel eller nede",
      "Besked ved statusændring",
      "Historik over hændelser",
    ],
    Mockup: SystemsMockup,
  },
  {
    bg: "bg-[#EAF1F7]",
    textFirst: false,
    label: "Team & brugere",
    title: "Giv hele teamet adgang",
    description:
      "Inviter kolleger til platformen med ét klik. Alle arbejder under samme virksomhed – hver med sit eget login og sin egen profil.",
    points: [
      "Ubegrænset teammedlemmer",
      "Administrator og medlem-roller",
      "Inviter via email på sekunder",
      "Alle ser samme sager og systemer",
    ],
    Mockup: TeamMockup,
  },
];

export default function PlatformenPage() {
  return (
    <MarketingShell>
      <main>
        <style>{`
          @keyframes mockupFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#4A7FA5] to-[#1E3448] py-20 pt-32 md:py-32 md:pt-40">
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
              Platformen
            </p>
            <AnimatedSection direction="up">
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Alt hvad din virksomhed har brug for – samlet ét sted
              </h1>
            </AnimatedSection>
            <AnimatedSection direction="up" delay={100}>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
                Ingen rod. Ingen forvirring. Bare overblik.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {blocks.map((block) => {
          const { Mockup, textFirst, bg, label, title, description, points } = block;
          return (
            <section key={label} className={`${bg} py-16 md:py-24`}>
              <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:gap-12 lg:grid-cols-2">
                <AnimatedSection
                  direction={textFirst ? "left" : "right"}
                  className={textFirst ? "lg:order-1" : "lg:order-2"}
                >
                  <FeatureCopy label={label} title={title} description={description} points={points} />
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
