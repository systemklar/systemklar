"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileSignature,
  FileText,
  Heart,
  HelpCircle,
  Lock,
  MessageSquare,
  Monitor,
  RefreshCw,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useInView } from "@/hooks/useInView";

const toolFeatures = [
  {
    n: "01",
    icon: FileSignature,
    title: "Tilbud på 2 minutter",
    text: "Beskriv hvad kunden skal bruge. Få et færdigt tilbud klar til at sende.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Spørg løs på dansk",
    text: "Stil spørgsmål om din IT og få et svar du faktisk forstår.",
    href: "/ai-vaerktoejer",
  },
  {
    n: "03",
    icon: Lock,
    title: "Adgangskoder samlet sikkert",
    text: "Ét sted til alle passwords – kun du og dit team har adgang.",
    href: "/platformen",
  },
];

const steps = [
  { n: "1", title: "Vi starter sammen", text: "Vi sætter det op for jer, så I hurtigt kommer i gang." },
  { n: "2", title: "Vi kobler jeres drift på", text: "Jeres systemer og support samles ét sted." },
  { n: "3", title: "I får ro i hverdagen", text: "I kan se status med det samme, uden at gætte." },
];

const pricePreview = [
  {
    name: "Starter",
    price: "499 kr/md",
  },
  {
    name: "Plus",
    price: "1.299 kr/md",
    highlight: true,
  },
  {
    name: "Pro",
    price: "2.499 kr/md",
  },
];

const platformHighlights = [
  { icon: Monitor, title: "Systemoverblik", text: "Se om alt kører med ét klik" },
  { icon: MessageSquare, title: "Support & sager", text: "Opret sager og følg status" },
  { icon: FileText, title: "Månedlig rapport", text: "Få overblik uden teknisk snak" },
];

const hourlyRate = 350;

const employeeOptions = [
  { id: "1-5", label: "1-5 ansatte", employees: 3 },
  { id: "6-15", label: "6-15 ansatte", employees: 10 },
  { id: "16-30", label: "16-30 ansatte", employees: 23 },
  { id: "30+", label: "30+ ansatte", employees: 35 },
] as const;

const wasteOptions = [
  {
    id: "passwords",
    icon: Lock,
    title: "Finde adgangskoder",
    subtitle: "Logins der ikke kan huskes",
    hours: 1.25,
  },
  {
    id: "ventetid",
    icon: Clock,
    title: "Vente på IT-hjælp",
    subtitle: "Når noget går ned eller fejler",
    hours: 0.75,
  },
  {
    id: "systemer",
    icon: Monitor,
    title: "Styre systemer manuelt",
    subtitle: "Ingen samlet overblik",
    hours: 0.5,
  },
  {
    id: "support",
    icon: MessageSquare,
    title: "Forklare problemer",
    subtitle: "Til ekstern IT-support",
    hours: 1.0,
  },
] as const;

const industryOptions = [
  { id: "haandvaerk", icon: Wrench, title: "Håndværk & byg", multiplier: 1.35 },
  { id: "handel", icon: ShoppingBag, title: "Handel & butik", multiplier: 1.25 },
  { id: "kontor", icon: Briefcase, title: "Kontor & rådgivning", multiplier: 1.1 },
  { id: "sundhed", icon: Heart, title: "Sundhed & pleje", multiplier: 1.3 },
  { id: "transport", icon: Truck, title: "Transport & logistik", multiplier: 1.25 },
  { id: "andet", icon: Building2, title: "Andet", multiplier: 1.15 },
] as const;

const setupOptions = [
  {
    id: "ingen",
    icon: HelpCircle,
    title: "Ingen fast løsning",
    subtitle: "Vi klarer os selv så godt vi kan",
    multiplier: 1.4,
  },
  {
    id: "konsulent",
    icon: UserCheck,
    title: "Ekstern IT-konsulent",
    subtitle: "Vi ringer nogen op når noget fejler",
    multiplier: 1.2,
  },
  {
    id: "intern",
    icon: User,
    title: "Intern medarbejder",
    subtitle: "En kollega tager sig af IT ved siden af sit job",
    multiplier: 1.1,
  },
  {
    id: "blanding",
    icon: Shuffle,
    title: "En blanding",
    subtitle: "Lidt af hvert afhængig af problemet",
    multiplier: 1.25,
  },
] as const;

const frequencyOptions = [
  { id: "aldrig", icon: CheckCircle, title: "Næsten aldrig", subtitle: "IT bare virker hos os", multiplier: 0.3 },
  {
    id: "maaned",
    icon: Calendar,
    title: "Et par gange om måneden",
    subtitle: "Af og til er der noget",
    multiplier: 0.7,
  },
  {
    id: "uge",
    icon: RefreshCw,
    title: "Ugentligt",
    subtitle: "Vi har jævnligt noget der driller",
    multiplier: 1.0,
  },
  {
    id: "dag",
    icon: AlertTriangle,
    title: "Nærmest dagligt",
    subtitle: "IT er en kilde til frustration",
    multiplier: 1.5,
  },
] as const;

type TabKey = "Overblik" | "Support" | "IT-rapport";

function useCountUp(target: number, duration: number, inView: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = window.setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        window.clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => window.clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

export function MarketingHomeContent() {
  const [yearly, setYearly] = useState(false);
  const [priceFading, setPriceFading] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(pricePreview);
  const [activeTab, setActiveTab] = useState<TabKey>("Overblik");
  const [changing, setChanging] = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView(0.2);

  const typePairs = useMemo(
    () => [
      {
        q: "Hvad betyder oppetid?",
        a: "Det betyder at dine systemer kører uden afbrydelse. Jeres oppetid er 99,9% denne måned.",
      },
      {
        q: "Hvornår kom den seneste rapport?",
        a: "Rapporten for april 2026 er klar. Alt ser godt ud – ingen kritiske fejl.",
      },
      {
        q: "Vi kan ikke printe",
        a: "Jeg har oprettet en sag til jer. Supportteamet kigger på det inden for 1 time.",
      },
    ],
    [],
  );
  const [pairIndex, setPairIndex] = useState(0);
  const [typedQuestion, setTypedQuestion] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const stepDelayRef = useRef<number | null>(null);
  const [calculatorStep, setCalculatorStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<(typeof employeeOptions)[number]["id"] | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<(typeof industryOptions)[number]["id"] | null>(null);
  const [selectedSetup, setSelectedSetup] = useState<(typeof setupOptions)[number]["id"] | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<(typeof frequencyOptions)[number]["id"] | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<Array<(typeof wasteOptions)[number]["id"]>>([]);

  useEffect(() => {
    const prices = yearly
      ? [
          { name: "Starter", price: "415 kr/md", highlight: false },
          { name: "Plus", price: "1.082 kr/md", highlight: true },
          { name: "Pro", price: "2.082 kr/md", highlight: false },
        ]
      : [
          { name: "Starter", price: "499 kr/md", highlight: false },
          { name: "Plus", price: "1.299 kr/md", highlight: true },
          { name: "Pro", price: "2.499 kr/md", highlight: false },
        ];
    setPriceFading(true);
    const timer = window.setTimeout(() => {
      setDisplayPrice(prices);
      setPriceFading(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [yearly]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const pair = typePairs[pairIndex];
      setTypedQuestion("");
      setShowAnswer(false);
      let i = 0;
      const typeChar = () => {
        if (cancelled) return;
        if (i <= pair.q.length) {
          setTypedQuestion(pair.q.slice(0, i));
          i += 1;
          typingTimeoutRef.current = window.setTimeout(typeChar, 40);
          return;
        }
        typingTimeoutRef.current = window.setTimeout(() => {
          if (cancelled) return;
          setShowAnswer(true);
          typingTimeoutRef.current = window.setTimeout(() => {
            if (cancelled) return;
            setShowAnswer(false);
            setTypedQuestion("");
            setPairIndex((prev) => (prev + 1) % typePairs.length);
          }, 2500);
        }, 600);
      };
      typeChar();
    };
    run();
    return () => {
      cancelled = true;
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [pairIndex, typePairs]);

  useEffect(() => {
    return () => {
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    };
  }, []);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setChanging(true);
    window.setTimeout(() => {
      setActiveTab(tab);
      setChanging(false);
    }, 150);
  };

  const supportCount = useCountUp(100, 800, statsInView);
  const platformCount = useCountUp(1, 800, statsInView);
  const bindingCount = useCountUp(0, 800, statsInView);
  const selectedEmployeeOption = employeeOptions.find((option) => option.id === selectedEmployees) ?? null;
  const selectedIndustryOption = industryOptions.find((option) => option.id === selectedIndustry) ?? null;
  const selectedSetupOption = setupOptions.find((option) => option.id === selectedSetup) ?? null;
  const selectedFrequencyOption = frequencyOptions.find((option) => option.id === selectedFrequency) ?? null;
  const employeeCount = selectedEmployeeOption?.employees ?? 0;
  const industryMultiplier = selectedIndustryOption?.multiplier ?? 1;
  const setupMultiplier = selectedSetupOption?.multiplier ?? 1;
  const frequencyMultiplier = selectedFrequencyOption?.multiplier ?? 1;
  const wasteHoursPerPerson = selectedWaste.reduce((sum, categoryId) => {
    const category = wasteOptions.find((item) => item.id === categoryId);
    return sum + (category?.hours ?? 0);
  }, 0);
  const weeklyWaste = employeeCount * wasteHoursPerPerson * frequencyMultiplier;
  const monthlyWasteHours = Math.round(weeklyWaste * 4);
  const monthlyWasteCost = Math.round(weeklyWaste * 4 * hourlyRate * industryMultiplier * setupMultiplier);
  const baseSavings = Math.round(monthlyWasteCost * 0.7);
  const consultantSavings = selectedSetup === "konsulent" ? employeeCount * 150 : 0;
  const systemklarSavings = baseSavings + consultantSavings;
  const plan =
    employeeCount <= 5
      ? { name: "Starter", price: 499 }
      : employeeCount <= 15
        ? { name: "Plus", price: 1299 }
        : { name: "Pro", price: 2499 };
  const netGain = systemklarSavings - plan.price;
  const resultHours = useCountUp(monthlyWasteHours, 1000, calculatorStep === 6);
  const resultLost = useCountUp(monthlyWasteCost, 1000, calculatorStep === 6);
  const resultSavings = useCountUp(systemklarSavings, 1000, calculatorStep === 6);
  const resultNet = useCountUp(Math.abs(netGain), 1000, calculatorStep === 6);
  const resultConsultant = useCountUp(consultantSavings, 1000, calculatorStep === 6);
  const indicatorStep = Math.min(calculatorStep, 5);
  const formatNumber = (value: number) => new Intl.NumberFormat("da-DK").format(value);

  const toggleWaste = (id: (typeof wasteOptions)[number]["id"]) => {
    setSelectedWaste((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleEmployeeSelect = (id: (typeof employeeOptions)[number]["id"]) => {
    setSelectedEmployees(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(2), 500);
  };

  const handleIndustrySelect = (id: (typeof industryOptions)[number]["id"]) => {
    setSelectedIndustry(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(3), 500);
  };

  const handleSetupSelect = (id: (typeof setupOptions)[number]["id"]) => {
    setSelectedSetup(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(4), 500);
  };

  const handleFrequencySelect = (id: (typeof frequencyOptions)[number]["id"]) => {
    setSelectedFrequency(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(5), 500);
  };

  const resetCalculator = () => {
    setSelectedEmployees(null);
    setSelectedIndustry(null);
    setSelectedSetup(null);
    setSelectedFrequency(null);
    setSelectedWaste([]);
    setCalculatorStep(1);
  };

  const contextLine =
    selectedIndustry === "haandvaerk" && selectedFrequency === "dag"
      ? "For en håndværksvirksomhed med daglige IT-problemer er dette et konservativt estimat."
      : selectedSetup === "konsulent"
        ? "Dertil kommer hvad I betaler jeres IT-konsulent – systemklar erstatter mange af disse opkald."
        : null;

  const industryRecommendation =
    selectedIndustry === "haandvaerk"
      ? "Systemovervågning der virker selv ude på pladsen"
      : selectedIndustry === "handel"
        ? "Hold styr på systemer der holder butikken kørende"
        : selectedIndustry === "sundhed"
          ? "Sikker og hurtig adgang til de systemer der betyder noget"
          : selectedIndustry === "transport"
            ? "Overblik over IT selv når teamet er på farten"
            : null;

  const urgencyText =
    selectedFrequency === "dag"
      ? "⚠️ Med daglige problemer taber I tid hver eneste dag. Jo hurtigere I kommer i gang, jo bedre."
      : selectedFrequency === "uge"
        ? "Med ugentlige forstyrrelser er der meget at hente – hurtigt."
        : selectedFrequency === "maaned"
          ? "Selv få månedlige problemer koster mere end de fleste tror."
          : selectedFrequency === "aldrig"
            ? "Godt – men der er stadig tid at spare på bedre IT-overblik."
            : "";

  return (
    <main>
      <section
        className="relative flex min-h-[90vh] scroll-mt-20 items-center overflow-hidden bg-gradient-to-br from-[#0A6EBD] via-[#1A8FD1] to-[#062840] py-48"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p
            className="fade-in-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            IT-platform til danske SMV&apos;er
          </p>
          <AnimatedSection direction="up" delay={0}>
            <h1 className="mx-auto mt-8 max-w-4xl text-6xl font-extrabold tracking-tight text-white md:text-7xl md:leading-[0.98]">
              Få styr på IT uden at bruge
              <br className="hidden md:block" />
              hele dagen på det
            </h1>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={100}>
            <p className="mx-auto mt-8 max-w-2xl text-xl text-white/80">
              Du kan se hvad der sker, vi holder øje, og du får besked i tide.
            </p>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={200}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A6EBD] transition-all duration-100 hover:bg-white/90 active:scale-95"
              >
                Book gratis demo
              </Link>
              <Link
                href="/platformen"
                className="inline-flex rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Se hvordan det virker
              </Link>
            </div>
          </AnimatedSection>
          <p
            className="fade-in-up mt-10 text-sm font-medium text-white/60"
            style={{ animationDelay: "320ms" }}
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span>Ingen binding</span>
              <span>·</span>
              <span>Opsig når som helst</span>
              <span>·</span>
              <span>Gratis at starte</span>
            </span>
          </p>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Alt på ét sted – præcis som det er
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Se hvordan platformen ser ud i praksis, med et overblik du kan forstå med det samme.
          </p>
          <div className="mt-16">
            <AnimatedSection direction="up">
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">systemklar.dk/portal</div>
                </div>
                <div className="p-4">
                  <div className="mb-4 flex gap-1 rounded-lg bg-[#F0F7FF] p-1">
                    {(["Overblik", "Support", "IT-rapport"] as TabKey[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all duration-200 ${
                          activeTab === tab ? "bg-white text-sky-700 shadow-sm" : "text-[#4A8CB5] hover:text-sky-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className={`transition-opacity duration-300 ${changing ? "opacity-0" : "opacity-100"}`}>
                    {activeTab === "Overblik" ? (
                      <div className="flex" style={{ height: "280px" }}>
                        <div className="flex w-40 flex-col gap-1 border-r border-sky-50 bg-[#F5FAFD] p-3">
                          <div className="mb-2 text-xs font-bold text-[#0A6EBD]">systemklar</div>
                          <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-700">Overblik</div>
                          <div className="px-2 py-1.5 text-xs text-slate-500">Support & sager</div>
                          <div className="px-2 py-1.5 text-xs text-slate-500">Kodebank</div>
                          <div className="px-2 py-1.5 text-xs text-slate-500">IT-rapport</div>
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
                        </div>
                      </div>
                    ) : null}
                    {activeTab === "Support" ? (
                      <div style={{ height: "280px" }}>
                        <div className="mb-3 text-sm font-bold text-[#0D1F2D]">Support & sager</div>
                        <div className="flex flex-col gap-2">
                          <div className="max-w-xs self-end rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-xs text-white">
                            Vores printer printer ikke – det haster lidt
                          </div>
                          <div className="max-w-xs self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-3 py-2 text-xs text-[#2C4A5E]">
                            Forstået! Vi kigger på det med det samme.
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {activeTab === "IT-rapport" ? (
                      <div style={{ height: "280px" }}>
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
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="up">
              <div className="mt-16 grid gap-8 md:grid-cols-3">
                {platformHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title}>
                      <Icon className="h-5 w-5 text-sky-600" />
                      <p className="mt-3 text-base font-semibold text-[#0D1F2D]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#2C4A5E]">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="bg-[#062840] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mx-auto inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
            AI-værktøjer
          </p>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
            Værktøjer der gør arbejdet for dig
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-white/70">
            Tre enkle værktøjer, der hjælper dig med de opgaver, som normalt tager unødigt lang tid.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {toolFeatures.map((item, index) => {
              const Icon = item.icon;
              return (
                <AnimatedSection key={item.title} direction="up" delay={(index * 100) as 0 | 100 | 200 | 300}>
                  <Link href={item.href} className="group block">
                    <article className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/15">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/70">{item.text}</p>
                      {index === 1 ? (
                        <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-xs">
                          <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-white/20 px-2 py-1 text-white">
                            {typedQuestion}
                            <span className="animate-pulse">|</span>
                          </div>
                          <div
                            className={`mt-2 max-w-[95%] rounded-xl rounded-tl-sm border border-white/20 bg-white/10 px-2 py-1 text-white/80 transition-opacity duration-300 ${
                              showAnswer ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {typePairs[pairIndex].a}
                          </div>
                        </div>
                      ) : null}
                      <span className="mt-4 text-sm text-sky-300 transition-colors hover:text-sky-200">Se mere →</span>
                    </article>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div ref={statsRef} className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4A8CB5]">Om systemklar</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
              Vi hjælper små virksomheder med at få ro på IT
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#2C4A5E]">
              Du får et enkelt overblik over support, systemer og opgaver. Det betyder færre overraskelser, hurtigere
              svar og mindre tid brugt på at jagte status.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">{supportCount}%</p>
                <p className="text-sm text-[#4A8CB5]">Dansk support</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">{platformCount} platform</p>
                <p className="text-sm text-[#4A8CB5]">Alt samlet</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0D1F2D]">{bindingCount} binding</p>
                <p className="text-sm text-[#4A8CB5]">Kom i gang i dag</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white">
            <div className="px-8 py-10">
              <p className="text-lg font-semibold text-[#0D1F2D]">Benjamin Sørensen</p>
              <p className="mt-1 text-sm text-[#4A8CB5]">Grundlægger, systemklar</p>
            </div>
            <div className="bg-[#062840] px-8 py-8">
              <p className="text-lg leading-relaxed text-white">
                "Vi byggede systemklar fordi SMV&apos;er fortjener samme IT-overblik som store virksomheder."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Sådan fungerer det</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Tre enkle trin, så du hurtigt får overblik uden at ændre hele din hverdag.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, idx) => (
              <AnimatedSection key={s.n} direction="up" delay={(idx * 100) as 0 | 100 | 200 | 300}>
                <div className="relative rounded-2xl border border-sky-100 bg-white p-6">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                      {s.n}
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-[#0D1F2D]">{s.title}</p>
                      <p className="mt-1 text-sm text-[#2C4A5E]">{s.text}</p>
                    </div>
                  </div>
                  {idx < steps.length - 1 ? (
                    <span className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-xl text-sky-300 md:block" aria-hidden>
                      →
                    </span>
                  ) : null}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-sky-600">Prøv det selv →</p>
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-[#0A6EBD] to-[#062840] p-1">
            <div className="rounded-[22px] bg-[#F0F7FF] p-10">
              <p className="mx-auto flex w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                IT-beregner
              </p>
              <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
                Hvad koster IT-rod din virksomhed?
              </h2>
              <p className="mt-3 text-center text-base text-[#2C4A5E]">Besvar 3 hurtige spørgsmål og få et konkret svar.</p>

              <div className="mt-8 flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    indicatorStep === stepNumber ? "bg-sky-600 text-white" : "bg-sky-200 text-sky-700"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 5 ? <div className="h-[2px] w-8 bg-sky-200" aria-hidden /> : null}
              </div>
            ))}
              </div>

              <div className="relative mt-10 min-h-[660px]">
            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 1 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">Hvor mange ansatte har I?</h3>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {employeeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleEmployeeSelect(option.id)}
                    className={`rounded-2xl p-5 text-center transition-all ${
                      selectedEmployees === option.id
                        ? "border border-sky-600 bg-sky-600 text-white shadow-md"
                        : "cursor-pointer border border-sky-100 bg-white hover:border-sky-400 hover:shadow-sm"
                    }`}
                  >
                    <Users className="mx-auto h-5 w-5" />
                    <p className="mt-2 text-base font-semibold">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 2 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">Hvad laver din virksomhed?</h3>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {industryOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleIndustrySelect(option.id)}
                      className={`rounded-2xl p-5 text-center transition-all ${
                        selectedIndustry === option.id
                          ? "border border-sky-600 bg-sky-600 text-white shadow-md"
                          : "cursor-pointer border border-sky-100 bg-white hover:border-sky-400 hover:shadow-sm"
                      }`}
                    >
                      <Icon className="mx-auto h-5 w-5" />
                      <p className="mt-2 text-base font-semibold">{option.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 3 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">Hvordan håndterer I IT i dag?</h3>
              <p className="mt-2 text-center text-sm text-[#2C4A5E]">Vær ærlig – det giver det mest præcise svar</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {setupOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSetupSelect(option.id)}
                      className={`rounded-2xl p-5 text-left transition-all ${
                        selectedSetup === option.id
                          ? "border border-sky-600 bg-sky-600 text-white shadow-md"
                          : "cursor-pointer border border-sky-100 bg-white hover:border-sky-400 hover:shadow-sm"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <p className="mt-2 text-base font-semibold">{option.title}</p>
                      <p className={`mt-1 text-sm ${selectedSetup === option.id ? "text-white/90" : "text-[#2C4A5E]"}`}>
                        {option.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 4 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">
                Hvor tit oplever I IT-problemer eller forstyrrelser?
              </h3>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {frequencyOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleFrequencySelect(option.id)}
                      className={`rounded-2xl p-5 text-left transition-all ${
                        selectedFrequency === option.id
                          ? "border border-sky-600 bg-sky-600 text-white shadow-md"
                          : "cursor-pointer border border-sky-100 bg-white hover:border-sky-400 hover:shadow-sm"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <p className="mt-2 text-base font-semibold">{option.title}</p>
                      <p className={`mt-1 text-sm ${selectedFrequency === option.id ? "text-white/90" : "text-[#2C4A5E]"}`}>
                        {option.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 5 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">Hvad bruger I unødigt tid på?</h3>
              <p className="mt-2 text-center text-sm text-[#2C4A5E]">Vælg alle der passer</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {wasteOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = selectedWaste.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleWaste(option.id)}
                      className={`rounded-2xl p-5 text-left transition-all ${
                        selected
                          ? "border border-sky-600 bg-sky-600 text-white shadow-md"
                          : "cursor-pointer border border-sky-100 bg-white hover:border-sky-400 hover:shadow-sm"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <p className="mt-2 text-base font-semibold">{option.title}</p>
                      <p className={`mt-1 text-sm ${selected ? "text-white/90" : "text-[#2C4A5E]"}`}>{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setCalculatorStep(6)}
                  disabled={selectedWaste.length === 0}
                  className="inline-flex rounded-full bg-sky-600 px-12 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Beregn resultat
                </button>
              </div>
            </div>

            <div
              className={`transition-all duration-[400ms] ${
                calculatorStep === 6 ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <AnimatedSection direction="up">
                <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-lg">
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </span>
                    <p className="text-lg font-semibold text-[#0D1F2D]">Her er jeres IT-regning</p>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-[#F8FCFF] p-4 text-center">
                      <p className="text-3xl font-bold text-[#0D1F2D]">{formatNumber(resultHours)} timer</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-[#4A8CB5]">Spildt tid per måned</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-[#F8FCFF] p-4 text-center">
                      <p className="text-3xl font-bold text-red-500">{formatNumber(resultLost)} kr</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-[#4A8CB5]">Tabt arbejdstid pr. måned</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-[#F8FCFF] p-4 text-center">
                      <p className="text-3xl font-bold text-sky-600">{formatNumber(resultSavings)} kr</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-[#4A8CB5]">systemklar sparer jer pr. måned</p>
                    </div>
                  </div>

                  {contextLine ? <p className="mt-4 text-sm text-[#2C4A5E]">{contextLine}</p> : null}

                  <div className="my-6 h-px bg-slate-200" />

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                    <p className="text-sm font-semibold text-green-800">
                      Med {plan.name}-planen til {formatNumber(plan.price)} kr/md får I:
                    </p>
                    <ul className="mt-3 space-y-2">
                      {selectedWaste.includes("passwords") ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Sikker kodebank – find alle logins på sekunder</span>
                        </li>
                      ) : null}
                      {selectedWaste.includes("ventetid") ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Support direkte i platformen – ingen ventetid</span>
                        </li>
                      ) : null}
                      {selectedWaste.includes("systemer") ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Samlet systemoverblik – alt på ét sted</span>
                        </li>
                      ) : null}
                      {selectedWaste.includes("support") ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Månedlig IT-rapport – vi forklarer det for dig</span>
                        </li>
                      ) : null}
                      {selectedSetup === "konsulent" ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Reducér jeres IT-konsulent udgifter med ca. {formatNumber(resultConsultant)} kr/md</span>
                        </li>
                      ) : null}
                      {industryRecommendation ? (
                        <li className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{industryRecommendation}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  <p className="mt-6 text-center text-2xl font-bold text-green-700">
                    Netto gevinst: {netGain < 0 ? "-" : "+"}
                    {formatNumber(resultNet)} kr/md efter abonnement
                  </p>
                  {urgencyText ? <p className="mt-4 text-center text-sm text-[#2C4A5E]">{urgencyText}</p> : null}

                  <Link
                    href="/kontakt"
                    className="mt-4 inline-flex w-full justify-center rounded-full bg-sky-600 px-8 py-3 font-semibold text-white"
                  >
                    Book en gratis demo
                  </Link>
                  <p className="mt-3 text-center text-xs text-[#7AAEC8]">
                    Beregningen er baseret på gennemsnitlig dansk timeløn (350 kr/t) og dokumenteret IT-tidsspild i
                    SMV&apos;er.
                  </p>
                  <button
                    onClick={resetCalculator}
                    className="mt-4 block w-full text-center text-sm text-[#4A8CB5] transition-colors hover:text-sky-600"
                  >
                    Start forfra
                  </button>
                </div>
              </AnimatedSection>
            </div>
          </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">Priser</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Vælg den plan der passer til jer i dag, og skift når behovet ændrer sig.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-[#0D1F2D]" : "text-[#4A8CB5]"}`}>Månedlig</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative h-6 w-12 rounded-full transition-colors duration-200 ${
                yearly ? "bg-sky-600" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  yearly ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-[#0D1F2D]" : "text-[#4A8CB5]"}`}>Årlig</span>
            <span
              className={`rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 transition-opacity duration-200 ${
                yearly ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              Spar 2 måneder
            </span>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {displayPrice.map((plan, index) => (
              <AnimatedSection key={plan.name} direction="up" delay={(index * 100) as 0 | 100 | 200 | 300}>
                <article
                  className={`rounded-3xl border px-8 py-10 text-center ${
                    plan.highlight
                      ? "border-2 border-sky-600 bg-white shadow-md"
                      : "border border-sky-200 bg-white shadow-sm"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#4A8CB5]">{plan.name}</p>
                  <p className={`mt-4 text-4xl font-bold text-[#0D1F2D] transition-opacity duration-200 ${priceFading ? "opacity-0" : "opacity-100"}`}>
                    {plan.price}
                  </p>
                  {yearly ? <p className="mt-1 text-xs text-[#4A8CB5]">faktureres årligt</p> : null}
                </article>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/priser" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
              Se alle features →
            </Link>
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative flex min-h-[400px] items-center border-b border-sky-900/70 bg-[#062840] bg-gradient-to-br from-[#062840] to-[#0A3D5C] py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Klar til at komme i gang?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#7AAEC8]">
            Få en kort gennemgang, så du ved præcis hvordan det virker i din hverdag.
          </p>
          <p className="mt-4 text-sm text-[#7AAEC8]">Ingen binding · Opsig når som helst</p>
          <Link
            href="/book-demo"
            className="mt-10 inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            Book gratis demo
          </Link>
        </div>
      </section>
    </main>
  );
}
