"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  HelpCircle,
  Lock,
  MessageSquare,
  Monitor,
  RefreshCw,
  ShoppingBag,
  Shuffle,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const pricePreview = [
  { name: "Starter", price: "499 kr/md", highlight: false },
  { name: "Plus", price: "1.299 kr/md", highlight: true },
  { name: "Pro", price: "2.499 kr/md", highlight: false },
];

const empathyItems = [
  { problem: "Bruger tid på at finde logins", solution: "Alle adgangskoder samlet sikkert ét sted" },
  { problem: "Venter dage på IT-hjælp", solution: "Opret en sag – vi svarer samme dag" },
  { problem: "Ved ikke om systemerne kører", solution: "Live overblik – du ser det med det samme" },
];

const featurePills = ["Realtids systemoverblik", "Support direkte i portalen", "Månedlig IT-rapport"];

const heroStatCards = [
  { icon: CheckCircle, label: "Systemer online", value: "100%", color: "text-green-400" },
  { icon: Clock, label: "Seneste sag løst", value: "2 timer", color: "text-sky-300" },
  { icon: FileText, label: "Rapport klar", value: "April 2026", color: "text-white" },
];

const featuredTestimonial = {
  quote:
    "Endelig ét sted hvor vi kan se om alt kører. Jeg vidste ikke altid om vores systemer var oppe – nu får vi besked med det samme hvis noget driller.",
  name: "Mads K.",
  company: "VVS-virksomhed, Aarhus",
  initials: "MK",
};

const sideTestimonials = [
  {
    quote: "Vi fik svar samme dag. Det plejede at tage dage.",
    name: "Lotte P.",
    company: "Regnskabskontor, Odense",
    initials: "LP",
  },
  {
    quote: "Rapporten giver os ro. Vi forstår IT uden teknik.",
    name: "Henrik B.",
    company: "Tømrermester, København",
    initials: "HB",
  },
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

const starPath =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

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
    const fadeTimer = window.setTimeout(() => setPriceFading(true), 0);
    const timer = window.setTimeout(() => {
      setDisplayPrice(prices);
      setPriceFading(false);
    }, 150);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(timer);
    };
  }, [yearly]);

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
      ? "Med daglige problemer taber I tid hver eneste dag. Jo hurtigere I kommer i gang, jo bedre."
      : selectedFrequency === "uge"
        ? "Med ugentlige forstyrrelser er der meget at hente – hurtigt."
        : selectedFrequency === "maaned"
          ? "Selv få månedlige problemer koster mere end de fleste tror."
          : selectedFrequency === "aldrig"
            ? "Godt – men der er stadig tid at spare på bedre IT-overblik."
            : "";

  return (
    <main className="flex flex-col">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(8px); }
        }
        .dot-drift { animation: drift 8s ease-in-out infinite; }
      `}</style>

      <section className="relative flex min-h-[90vh] scroll-mt-20 items-center overflow-hidden bg-gradient-to-br from-[#0A6EBD] via-[#1A8FD1] to-[#062840] py-32 md:py-40">
        <div
          className="dot-drift absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p
                className="fade-in-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
                style={{ animationDelay: "40ms" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                Bygget til danske SMV&apos;er – uden IT-afdeling
              </p>
              <AnimatedSection direction="up" delay={0}>
                <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-white md:text-6xl md:leading-[0.98] lg:text-7xl">
                  Få styr på IT.
                  <br />
                  Brug tiden på din forretning.
                </h1>
              </AnimatedSection>
              <AnimatedSection direction="up" delay={100}>
                <p className="mt-8 max-w-xl text-lg text-white/80 md:text-xl">
                  systemklar samler support, systemoverblik og IT-dokumentation ét sted – så du aldrig igen skal jagte
                  adgangskoder eller vente på IT-hjælp.
                </p>
              </AnimatedSection>
              <AnimatedSection direction="up" delay={200}>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  <button
                    onClick={() => document.getElementById("roi-beregner")?.scrollIntoView({ behavior: "smooth" })}
                    className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[#0A6EBD] transition-all hover:bg-white/90"
                  >
                    Se hvad IT-rod koster jer
                  </button>
                  <a
                    href="/kontakt"
                    className="rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
                  >
                    Book en gratis snak
                  </a>
                </div>
              </AnimatedSection>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-sm text-white/60 md:justify-start">
                {["Ingen binding", "Opsig når som helst", "Svar inden for 1 hverdag", "Dansk support"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden flex-col gap-3 md:flex md:items-end">
              {heroStatCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white shadow-lg backdrop-blur-md"
                    style={{ animation: `slideInRight 0.6s ease-out ${i * 0.15}s both` }}
                  >
                    <p className={`mb-0.5 flex items-center gap-1.5 text-xs font-medium ${card.color}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {card.label}
                    </p>
                    <p className="text-lg font-bold">{card.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-5 text-3xl font-bold leading-tight text-[#0D1F2D] md:text-4xl">
            Du startede ikke din virksomhed
            <br />
            for at rode med IT
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-[#2C4A5E]">
            Men adgangskoder forsvinder, systemer driller, og IT-hjælp tager dage. systemklar tager det fra dig – så du
            kan fokusere på det du er god til.
          </p>
          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
            {empathyItems.map((item) => (
              <div
                key={item.problem}
                className="cursor-default rounded-2xl border border-sky-100 bg-[#F0F7FF] p-5 transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <p className="mb-2 text-sm font-medium text-red-500 line-through">{item.problem}</p>
                <p className="flex items-start gap-2 text-sm font-semibold text-[#0D1F2D]">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <div className="flex animate-bounce flex-col items-center gap-2 text-xs text-[#4A8CB5]">
              <span>Se hvad du får</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F0F7FF] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0D1F2D] md:text-4xl">
            Alt på ét sted – præcis som det er
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#2C4A5E]">
            Se hvordan platformen ser ud i praksis, med et overblik du kan forstå med det samme.
          </p>
          <div className="mt-16">
            <AnimatedSection direction="up">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-sky-300/20 blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                  <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 rounded-full bg-white px-3 py-1 text-xs text-[#4A8CB5]">
                      systemklar.dk/portal
                    </div>
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
                            <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-700">
                              Overblik
                            </div>
                            <div className="px-2 py-1.5 text-xs text-slate-500">Support &amp; sager</div>
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
                          <div className="mb-3 text-sm font-bold text-[#0D1F2D]">Support &amp; sager</div>
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
              </div>
            </AnimatedSection>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {featurePills.map((feature, i) => (
                <span
                  key={feature}
                  className="rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm font-medium text-sky-700 shadow-sm"
                  style={{ animation: `fadeUp 0.5s ease-out ${0.1 + i * 0.1}s both` }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roi-beregner" className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-600">Prøv det selv</p>
            <h2 className="text-3xl font-bold text-[#0D1F2D]">Hvad koster IT-rod din virksomhed?</h2>
            <p className="mx-auto mt-3 max-w-lg text-[#2C4A5E]">
              Besvar 5 spørgsmål og få et præcist svar på hvad I taber – og hvad I kan spare.
            </p>
          </div>
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-[#0A6EBD] to-[#062840] p-1">
            <div className="rounded-[22px] bg-[#F0F7FF] p-10">
              <div className="flex items-center justify-center gap-3">
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
                    calculatorStep === 1
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
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
                    calculatorStep === 2
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
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
                    calculatorStep === 3
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="text-center text-2xl font-semibold text-[#0D1F2D]">Hvordan håndterer I IT i dag?</h3>
                  <p className="mt-2 text-center text-sm text-[#2C4A5E]">
                    Vær ærlig – det giver det mest præcise svar
                  </p>
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
                          <p
                            className={`mt-1 text-sm ${
                              selectedSetup === option.id ? "text-white/90" : "text-[#2C4A5E]"
                            }`}
                          >
                            {option.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 4
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
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
                          <p
                            className={`mt-1 text-sm ${
                              selectedFrequency === option.id ? "text-white/90" : "text-[#2C4A5E]"
                            }`}
                          >
                            {option.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 5
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
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
                          <p className={`mt-1 text-sm ${selected ? "text-white/90" : "text-[#2C4A5E]"}`}>
                            {option.subtitle}
                          </p>
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
                    calculatorStep === 6
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
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
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#4A8CB5]">
                            Tabt arbejdstid pr. måned
                          </p>
                        </div>
                        <div className="rounded-2xl border border-sky-100 bg-[#F8FCFF] p-4 text-center">
                          <p className="text-3xl font-bold text-sky-600">{formatNumber(resultSavings)} kr</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#4A8CB5]">
                            systemklar sparer jer pr. måned
                          </p>
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
                              <span>
                                Reducér jeres IT-konsulent udgifter med ca. {formatNumber(resultConsultant)} kr/md
                              </span>
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
                      {urgencyText ? (
                        <p className="mt-4 text-center text-sm text-[#2C4A5E]">{urgencyText}</p>
                      ) : null}

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

      <section className="bg-[#F0F7FF] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-sky-600">
            Hvad kunderne siger
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-3xl bg-[#062840] p-8 text-white md:col-span-2">
              <div className="mb-6 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d={starPath} />
                  </svg>
                ))}
              </div>
              <p className="mb-8 flex-1 text-xl leading-relaxed text-white/90">{`"${featuredTestimonial.quote}"`}</p>
              <div className="flex items-center gap-3 border-t border-white/10 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                  {featuredTestimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-white">{featuredTestimonial.name}</p>
                  <p className="text-sm text-white/50">{featuredTestimonial.company}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {sideTestimonials.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-1 flex-col justify-between rounded-2xl border border-sky-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d={starPath} />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-[#2C4A5E]">{`"${t.quote}"`}</p>
                  <div className="flex items-center gap-2 border-t border-sky-50 pt-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0D1F2D]">{t.name}</p>
                      <p className="text-[10px] text-[#4A8CB5]">{t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
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
          <p className="mx-auto mb-10 mt-4 max-w-xl text-center text-[#2C4A5E]">
            Prisen betaler sig typisk ind på den første uge.
            <button
              onClick={() => document.getElementById("roi-beregner")?.scrollIntoView({ behavior: "smooth" })}
              className="ml-1 font-medium text-sky-600 hover:underline"
            >
              Se hvad IT-rod koster jer →
            </button>
          </p>
          <div className="mt-10 flex min-h-8 items-center justify-center gap-3">
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
              className={`min-w-[110px] rounded-full bg-green-100 px-2 py-0.5 text-center text-xs font-semibold text-green-700 transition-opacity duration-200 ${
                yearly ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              Spar 2 måneder
            </span>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {displayPrice.map((priceCard, index) => (
              <AnimatedSection
                key={priceCard.name}
                direction="up"
                delay={(index * 100) as 0 | 100 | 200 | 300}
              >
                <div className="relative">
                  {priceCard.highlight ? (
                    <div
                      className="pointer-events-none absolute -inset-0.5 animate-pulse rounded-[26px] bg-sky-400/30 blur-sm"
                      aria-hidden
                    />
                  ) : null}
                  <article
                    className={`relative rounded-3xl border px-8 py-10 text-center ${
                      priceCard.highlight
                        ? "border-2 border-sky-600 bg-white shadow-md"
                        : "border border-sky-200 bg-white shadow-sm"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#4A8CB5]">{priceCard.name}</p>
                    <p
                      className={`mt-4 text-4xl font-bold text-[#0D1F2D] transition-opacity duration-200 ${
                        priceFading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {priceCard.price}
                    </p>
                    {yearly ? <p className="mt-1 text-xs text-[#4A8CB5]">faktureres årligt</p> : null}
                  </article>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/priser" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
              Se alle features →
            </Link>
            <p className="mt-4 text-center text-sm text-[#4A8CB5]">
              Ingen binding · Opsig når som helst · Kom i gang på 10 minutter
            </p>
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative flex min-h-[400px] items-center border-b border-sky-900/70 bg-[#062840] bg-gradient-to-br from-[#062840] to-[#0A3D5C] py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Klar til at få IT ud af vejen?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#7AAEC8]">
            Book en gratis snak på 30 minutter. Vi gennemgår platformen og sætter det op til jer – samme dag.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            Book en gratis snak
          </Link>
          <p className="mt-4 text-sm text-[#7AAEC8]">30 min · gratis · uforpligtende · ingen binding</p>
        </div>
      </section>
    </main>
  );
}
