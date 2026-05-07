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

const featurePills = ["Realtids systemoverblik", "Support direkte i portalen", "Månedlig IT-rapport"];

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

type HomePlan = {
  name: string;
  monthly: string;
  yearly: string;
  fits: string;
  features: string[];
  highlight?: boolean;
};

const homePlans: HomePlan[] = [
  {
    name: "Starter",
    monthly: "499 kr/md",
    yearly: "415 kr/md",
    fits: "Passer til 1-5 ansatte",
    features: ["IT-overblik", "Support & sager", "Sikker kodebank"],
  },
  {
    name: "Plus",
    monthly: "1.299 kr/md",
    yearly: "1.082 kr/md",
    fits: "Passer til 6-15 ansatte",
    features: ["Alt i Starter", "AI-assistent", "Op til 15 brugere"],
    highlight: true,
  },
  {
    name: "Pro",
    monthly: "2.499 kr/md",
    yearly: "2.082 kr/md",
    fits: "Passer til 16+ ansatte",
    features: ["Alt i Plus", "Dedikeret kontakt", "SLA-garanti"],
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
    subtitle: "Vi klarer os selv",
    multiplier: 1.4,
  },
  {
    id: "konsulent",
    icon: UserCheck,
    title: "Ekstern IT-konsulent",
    subtitle: "Vi ringer ved fejl",
    multiplier: 1.2,
  },
  {
    id: "intern",
    icon: User,
    title: "Intern medarbejder",
    subtitle: "Kollega tager sig af IT",
    multiplier: 1.1,
  },
  {
    id: "blanding",
    icon: Shuffle,
    title: "En blanding",
    subtitle: "Lidt af hvert",
    multiplier: 1.25,
  },
] as const;

const frequencyOptions = [
  { id: "aldrig", icon: CheckCircle, title: "Næsten aldrig", subtitle: "IT bare virker", multiplier: 0.3 },
  {
    id: "maaned",
    icon: Calendar,
    title: "Et par gange om md.",
    subtitle: "Af og til",
    multiplier: 0.7,
  },
  {
    id: "uge",
    icon: RefreshCw,
    title: "Ugentligt",
    subtitle: "Jævnligt noget der driller",
    multiplier: 1.0,
  },
  {
    id: "dag",
    icon: AlertTriangle,
    title: "Nærmest dagligt",
    subtitle: "IT er en frustration",
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
  const [activeTab, setActiveTab] = useState<TabKey>("Overblik");
  const [changing, setChanging] = useState(false);

  const stepDelayRef = useRef<number | null>(null);
  const [calculatorStep, setCalculatorStep] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<(typeof employeeOptions)[number]["id"] | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<(typeof industryOptions)[number]["id"] | null>(null);
  const [selectedSetup, setSelectedSetup] = useState<(typeof setupOptions)[number]["id"] | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<(typeof frequencyOptions)[number]["id"] | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<Array<(typeof wasteOptions)[number]["id"]>>([]);
  const [cvrInput, setCvrInput] = useState("");
  const [cvrLoading, setCvrLoading] = useState(false);
  const [cvrError, setCvrError] = useState<string | null>(null);
  const [cvrData, setCvrData] = useState<{ name: string; employees: number; industry: string } | null>(null);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const [heroBgOpacity, setHeroBgOpacity] = useState(1);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPriceFading(true), 0);
    const restoreTimer = window.setTimeout(() => setPriceFading(false), 250);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(restoreTimer);
    };
  }, [yearly]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const contentOpacity = Math.max(0, 1 - scrollY / 300);
      const bgOpacity = Math.max(0, 1 - (scrollY - 200) / 400);
      setHeroOpacity(contentOpacity);
      setHeroBgOpacity(bgOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    setCvrInput("");
    setCvrError(null);
    setCvrData(null);
    setCalculatorStep(0);
  };

  type EmployeeId = (typeof employeeOptions)[number]["id"];
  type IndustryId = (typeof industryOptions)[number]["id"];

  const handleCvrLookup = async () => {
    if (cvrInput.trim().length < 2) return;
    setCvrLoading(true);
    setCvrError(null);
    try {
      const res = await fetch(
        `https://cvrapi.dk/api?search=${encodeURIComponent(cvrInput.trim())}&country=dk`,
        { headers: { "User-Agent": "systemklar.dk ROI-beregner" } },
      );
      if (!res.ok) throw new Error("Ikke fundet");
      const data = (await res.json()) as {
        name?: string;
        employees?: number;
        industrycode?: string | number;
        industrydesc?: string;
        error?: string | boolean;
      };
      if (data.error) throw new Error("Virksomhed ikke fundet");

      const employees = data.employees ?? 1;
      const industryCode = data.industrycode ?? "";
      const industryDesc = data.industrydesc ?? "";

      setCvrData({
        name: data.name ?? cvrInput,
        employees,
        industry: industryDesc,
      });

      let employeeCategory: EmployeeId = "1-5";
      if (employees >= 30) employeeCategory = "30+";
      else if (employees >= 16) employeeCategory = "16-30";
      else if (employees >= 6) employeeCategory = "6-15";
      setSelectedEmployees(employeeCategory);

      const code = String(industryCode);
      let mappedIndustry: IndustryId = "andet";
      if (code.startsWith("41") || code.startsWith("42") || code.startsWith("43")) mappedIndustry = "haandvaerk";
      else if (code.startsWith("45") || code.startsWith("46") || code.startsWith("47")) mappedIndustry = "handel";
      else if (
        code.startsWith("49") ||
        code.startsWith("50") ||
        code.startsWith("51") ||
        code.startsWith("52") ||
        code.startsWith("53")
      )
        mappedIndustry = "transport";
      else if (code.startsWith("86") || code.startsWith("87") || code.startsWith("88")) mappedIndustry = "sundhed";
      else if (
        code.startsWith("69") ||
        code.startsWith("70") ||
        code.startsWith("71") ||
        code.startsWith("72") ||
        code.startsWith("73") ||
        code.startsWith("74") ||
        code.startsWith("75")
      )
        mappedIndustry = "kontor";
      setSelectedIndustry(mappedIndustry);

      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
      stepDelayRef.current = window.setTimeout(() => setCalculatorStep(1), 800);
    } catch {
      setCvrError("Vi kunne ikke finde virksomheden. Tjek CVR-nummer eller navn og prøv igen.");
    } finally {
      setCvrLoading(false);
    }
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

  const stepCardClass = (active: boolean) =>
    `relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left text-xs transition-all ${
      active
        ? "border-sky-600 bg-sky-600 text-white shadow-sm"
        : "cursor-pointer border-sky-100 bg-white text-[#0D1F2D] hover:border-sky-400 hover:shadow-sm"
    }`;

  return (
    <main className="flex flex-col">
      <style>{`
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

      <section className="sticky top-0 z-0 flex min-h-screen items-center justify-center overflow-hidden border-t border-black/5 py-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0A6EBD] to-[#062840]"
          style={{ opacity: heroBgOpacity }}
          aria-hidden
        />
        <div
          className="dot-drift absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: heroBgOpacity * 0.1,
          }}
          aria-hidden
        />
        <div
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
          style={{ opacity: heroOpacity, transform: `translateY(${(1 - heroOpacity) * -30}px)` }}
        >
          <p
            className="fade-in-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            Bygget til danske SMV&apos;er – uden IT-afdeling
          </p>
          <AnimatedSection direction="up" delay={0}>
            <h1 className="mb-3 mt-6 text-6xl font-extrabold tracking-tight text-white md:text-7xl">
              Få styr på IT.
              <br />
              Brug tiden på din forretning.
            </h1>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={100}>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-white/80 md:text-xl">
              systemklar samler support, systemoverblik og IT-dokumentation ét sted – så du aldrig igen skal jagte
              adgangskoder eller vente på IT-hjælp.
            </p>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={200}>
            <div className="inline-flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => document.getElementById("roi-beregner")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-[#0A6EBD] transition-all hover:bg-white/90"
              >
                Se hvad IT-rod koster jer
              </button>
              <a
                href="/kontakt"
                className="rounded-full border border-white/40 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Book en gratis snak
              </a>
            </div>
          </AnimatedSection>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            {["Ingen binding", "Opsig når som helst", "Svar inden for 1 hverdag", "Dansk support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
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
      </section>

      <section className="relative z-10 border-t border-black/5 bg-[#F0F7FF] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[#0D1F2D]">
            Alt på ét sted – præcis som det er
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-[#2C4A5E]">
            Se hvordan platformen ser ud i praksis – med et overblik du kan forstå med det samme.
          </p>
        </div>
        <div className="mx-auto max-w-2xl px-6">
          <AnimatedSection direction="up">
            <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md">
              <div className="flex items-center gap-2 border-b border-sky-100 bg-[#F0F7FF] px-3 py-2">
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 rounded-full bg-white px-3 py-0.5 text-[10px] text-[#4A8CB5]">
                  systemklar.dk/portal
                </div>
              </div>
              <div className="p-3">
                <div className="mb-3 flex gap-1 rounded-lg bg-[#F0F7FF] p-1">
                  {(["Overblik", "Support", "IT-rapport"] as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
                        activeTab === tab ? "bg-white text-sky-700 shadow-sm" : "text-[#4A8CB5] hover:text-sky-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className={`transition-opacity duration-300 ${changing ? "opacity-0" : "opacity-100"}`}>
                  {activeTab === "Overblik" ? (
                    <div className="flex" style={{ height: "220px" }}>
                      <div className="flex w-32 flex-col gap-1 border-r border-sky-50 bg-[#F5FAFD] p-2.5">
                        <div className="mb-1 text-[10px] font-bold text-[#0A6EBD]">systemklar</div>
                        <div className="rounded-md bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700">
                          Overblik
                        </div>
                        <div className="px-2 py-1 text-[10px] text-slate-500">Support</div>
                        <div className="px-2 py-1 text-[10px] text-slate-500">Kodebank</div>
                        <div className="px-2 py-1 text-[10px] text-slate-500">IT-rapport</div>
                      </div>
                      <div className="flex-1 bg-white p-3">
                        <div className="mb-0.5 text-xs font-bold text-[#0D1F2D]">Goddag, Møllers VVS</div>
                        <div className="mb-2 text-[10px] text-[#4A8CB5]">Her er dagens overblik.</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="rounded-md bg-[#F0F7FF] p-1.5 text-center">
                            <div className="text-xs font-bold text-[#0A6EBD]">3</div>
                            <div className="text-[9px] text-[#4A8CB5]">Systemer OK</div>
                          </div>
                          <div className="rounded-md bg-[#F0F7FF] p-1.5 text-center">
                            <div className="text-xs font-bold text-[#0A6EBD]">1</div>
                            <div className="text-[9px] text-[#4A8CB5]">Åben sag</div>
                          </div>
                          <div className="rounded-md bg-[#F0F7FF] p-1.5 text-center">
                            <div className="text-xs font-bold text-[#0A6EBD]">apr</div>
                            <div className="text-[9px] text-[#4A8CB5]">Rapport</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {activeTab === "Support" ? (
                    <div style={{ height: "220px" }} className="p-1">
                      <div className="mb-2 text-xs font-bold text-[#0D1F2D]">Support &amp; sager</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-sky-600 px-2.5 py-1.5 text-[10px] text-white">
                          Vores printer printer ikke – det haster lidt
                        </div>
                        <div className="max-w-[80%] self-start rounded-2xl rounded-tl-sm bg-[#F0F7FF] px-2.5 py-1.5 text-[10px] text-[#2C4A5E]">
                          Forstået! Vi kigger på det med det samme.
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {activeTab === "IT-rapport" ? (
                    <div style={{ height: "220px" }} className="p-1">
                      <div className="text-xs font-bold text-[#0D1F2D]">IT-rapport – april 2026</div>
                      <div className="mb-2 text-[10px] text-[#4A8CB5]">Møllers VVS</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="rounded-md bg-green-50 p-1.5 text-center">
                          <div className="text-xs font-bold text-green-700">100%</div>
                          <div className="text-[9px] text-green-600">Oppetid</div>
                        </div>
                        <div className="rounded-md bg-[#F0F7FF] p-1.5 text-center">
                          <div className="text-xs font-bold text-[#0A6EBD]">3</div>
                          <div className="text-[9px] text-[#4A8CB5]">Løste sager</div>
                        </div>
                        <div className="rounded-md bg-[#F0F7FF] p-1.5 text-center">
                          <div className="text-xs font-bold text-[#0A6EBD]">0</div>
                          <div className="text-[9px] text-[#4A8CB5]">Åbne sager</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </AnimatedSection>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {featurePills.map((feature, i) => (
              <span
                key={feature}
                className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700 shadow-sm"
                style={{ animation: `fadeUp 0.5s ease-out ${0.1 + i * 0.1}s both` }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="roi-beregner" className="relative z-10 border-t border-black/5 bg-white py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-600">Prøv det selv</p>
          <h2 className="mb-3 text-3xl font-bold text-[#0D1F2D]">Hvad koster IT-rod din virksomhed?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-[#2C4A5E]">
            Besvar 5 spørgsmål og få et præcist svar på hvad I taber – og hvad I kan spare.
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-[#062840] p-[1px]">
            <div className="rounded-[15px] bg-white p-8">
              <div className="mb-4 flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((stepIndex) => (
                  <div
                    key={stepIndex}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      indicatorStep === stepIndex ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-400"
                    }`}
                  >
                    {stepIndex + 1}
                  </div>
                ))}
              </div>

              <div className="relative min-h-[420px]">
                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 0
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="mb-1 text-base font-semibold text-[#0D1F2D]">Hvad hedder din virksomhed?</h3>
                  <p className="mb-3 text-xs text-[#4A8CB5]">
                    Indtast CVR-nummer eller virksomhedsnavn – vi finder resten automatisk.
                  </p>
                  <input
                    type="text"
                    value={cvrInput}
                    onChange={(e) => {
                      setCvrInput(e.target.value);
                      setCvrError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCvrLookup();
                    }}
                    placeholder="CVR-nummer eller virksomhedsnavn..."
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleCvrLookup}
                    disabled={cvrLoading || cvrInput.trim().length < 2}
                    className="mt-3 w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-700 disabled:opacity-50"
                  >
                    {cvrLoading ? "Søger..." : "Find virksomhed →"}
                  </button>
                  {cvrError ? <p className="mt-2 text-xs text-red-500">{cvrError}</p> : null}
                  {cvrData ? (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-600">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D1F2D]">{cvrData.name}</p>
                        <p className="text-xs text-[#4A8CB5]">
                          {cvrData.employees} ansatte · {cvrData.industry}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <button
                    onClick={() => setCalculatorStep(1)}
                    className="mx-auto mt-4 block text-xs text-[#4A8CB5] transition-colors hover:text-sky-600"
                  >
                    Spring over og udfyld manuelt →
                  </button>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 1
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="mb-3 text-base font-semibold text-[#0D1F2D]">Hvor mange ansatte har I?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {employeeOptions.map((option) => {
                      const active = selectedEmployees === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleEmployeeSelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          {active && cvrData ? (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-semibold text-white">
                              Fra CVR
                            </span>
                          ) : null}
                          <Users className="h-4 w-4" />
                          <p className="text-xs font-medium">{option.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 2
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="mb-3 text-base font-semibold text-[#0D1F2D]">Hvad laver din virksomhed?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {industryOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedIndustry === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleIndustrySelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          {active && cvrData ? (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-semibold text-white">
                              Fra CVR
                            </span>
                          ) : null}
                          <Icon className="h-4 w-4" />
                          <p className="text-xs font-medium">{option.title}</p>
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
                  <h3 className="mb-3 text-base font-semibold text-[#0D1F2D]">Hvordan håndterer I IT i dag?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {setupOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedSetup === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSetupSelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          <Icon className="h-4 w-4" />
                          <p className="text-xs font-medium">{option.title}</p>
                          <p className={`text-[10px] ${active ? "text-white/80" : "text-[#4A8CB5]"}`}>
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
                  <h3 className="mb-3 text-base font-semibold text-[#0D1F2D]">Hvor tit oplever I IT-problemer?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {frequencyOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedFrequency === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleFrequencySelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          <Icon className="h-4 w-4" />
                          <p className="text-xs font-medium">{option.title}</p>
                          <p className={`text-[10px] ${active ? "text-white/80" : "text-[#4A8CB5]"}`}>
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
                  <h3 className="mb-1 text-base font-semibold text-[#0D1F2D]">Hvad bruger I unødigt tid på?</h3>
                  <p className="mb-3 text-[10px] uppercase tracking-wide text-[#4A8CB5]">Vælg alle der passer</p>
                  <div className="grid grid-cols-2 gap-2">
                    {wasteOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = selectedWaste.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleWaste(option.id)}
                          className={stepCardClass(selected)}
                        >
                          <Icon className="h-4 w-4" />
                          <p className="text-xs font-medium">{option.title}</p>
                          <p className={`text-[10px] ${selected ? "text-white/80" : "text-[#4A8CB5]"}`}>
                            {option.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setCalculatorStep(6)}
                      disabled={selectedWaste.length === 0}
                      className="inline-flex rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    {cvrData ? (
                      <p className="mb-4 text-center text-xs text-[#4A8CB5]">
                        Beregning for <span className="font-semibold text-[#0D1F2D]">{cvrData.name}</span>
                      </p>
                    ) : null}
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </span>
                      <p className="text-sm font-semibold text-[#0D1F2D]">Her er jeres IT-regning</p>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      <div className="rounded-xl border border-sky-100 bg-[#F8FCFF] p-3 text-center">
                        <p className="text-2xl font-bold text-[#0D1F2D]">{formatNumber(resultHours)}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#4A8CB5]">Timer / md.</p>
                      </div>
                      <div className="rounded-xl border border-sky-100 bg-[#F8FCFF] p-3 text-center">
                        <p className="text-2xl font-bold text-red-500">{formatNumber(resultLost)} kr</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#4A8CB5]">Tabt arbejdstid</p>
                      </div>
                      <div className="rounded-xl border border-sky-100 bg-[#F8FCFF] p-3 text-center">
                        <p className="text-2xl font-bold text-sky-600">{formatNumber(resultSavings)} kr</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#4A8CB5]">systemklar sparer</p>
                      </div>
                    </div>
                    {contextLine ? <p className="mt-3 text-xs text-[#2C4A5E]">{contextLine}</p> : null}
                    <div className="my-4 h-px bg-slate-200" />
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-xs">
                      <p className="font-semibold text-green-800">
                        Med {plan.name}-planen til {formatNumber(plan.price)} kr/md får I:
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {selectedWaste.includes("passwords") ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>Sikker kodebank – find alle logins på sekunder</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("ventetid") ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>Support direkte i platformen – ingen ventetid</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("systemer") ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>Samlet systemoverblik – alt på ét sted</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("support") ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>Månedlig IT-rapport – vi forklarer det for dig</span>
                          </li>
                        ) : null}
                        {selectedSetup === "konsulent" ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>
                              Reducér jeres IT-konsulent udgifter med ca. {formatNumber(resultConsultant)} kr/md
                            </span>
                          </li>
                        ) : null}
                        {industryRecommendation ? (
                          <li className="flex items-start gap-1.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{industryRecommendation}</span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    <p className="mt-4 text-center text-lg font-bold text-green-700">
                      Netto gevinst: {netGain < 0 ? "-" : "+"}
                      {formatNumber(resultNet)} kr/md
                    </p>
                    {urgencyText ? <p className="mt-2 text-center text-xs text-[#2C4A5E]">{urgencyText}</p> : null}
                    <div className="mt-4 flex justify-center">
                      <Link
                        href="/kontakt"
                        className="inline-flex rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white"
                      >
                        Book en gratis demo
                      </Link>
                    </div>
                    <p className="mt-2 text-center text-[10px] text-[#7AAEC8]">
                      Beregningen er baseret på dansk timeløn (350 kr/t) og dokumenteret IT-tidsspild i SMV&apos;er.
                    </p>
                    <button
                      onClick={resetCalculator}
                      className="mt-3 block w-full text-center text-xs text-[#4A8CB5] transition-colors hover:text-sky-600"
                    >
                      Start forfra
                    </button>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-black/5 bg-[#062840] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-sky-300">Hvad kunderne siger</p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-8 text-white md:col-span-2">
            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d={starPath} />
                </svg>
              ))}
            </div>
            <p className="mb-6 flex-1 text-lg leading-relaxed text-white/90">{`"${featuredTestimonial.quote}"`}</p>
            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                {featuredTestimonial.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{featuredTestimonial.name}</p>
                <p className="text-xs text-white/50">{featuredTestimonial.company}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {sideTestimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-1 flex-col justify-between rounded-2xl border border-white/10 bg-white/10 p-8"
              >
                <div className="mb-2 flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <svg
                      key={s}
                      className="h-3 w-3 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path d={starPath} />
                    </svg>
                  ))}
                </div>
                <p className="mb-3 flex-1 text-xs leading-relaxed text-white/80">{`"${t.quote}"`}</p>
                <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-white/50">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-black/5 bg-[#F0F7FF] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[#0D1F2D]">Priser</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-[#2C4A5E]">
            Vælg den plan der passer til jer i dag, og skift når behovet ændrer sig.
          </p>
        </div>
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-6 flex min-h-8 items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-[#0D1F2D]" : "text-[#4A8CB5]"}`}>Månedlig</span>
            <button
              onClick={() => setYearly(!yearly)}
              aria-label={yearly ? "Skift til månedlig" : "Skift til årlig"}
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
          <div className="grid gap-8 md:grid-cols-3">
            {homePlans.map((priceCard, index) => (
              <AnimatedSection
                key={priceCard.name}
                direction="up"
                delay={(index * 100) as 0 | 100 | 200 | 300}
              >
                <div className="relative h-full">
                  {priceCard.highlight ? (
                    <div
                      className="pointer-events-none absolute -inset-0.5 animate-pulse rounded-[18px] bg-sky-400/30 blur-sm"
                      aria-hidden
                    />
                  ) : null}
                  <article
                    className={`relative flex h-full flex-col rounded-2xl bg-white p-8 ${
                      priceCard.highlight
                        ? "border-2 border-sky-600 shadow-md"
                        : "border border-sky-200 shadow-sm"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">{priceCard.name}</p>
                    <p
                      className={`mt-2 text-3xl font-bold text-[#0D1F2D] transition-opacity duration-200 ${
                        priceFading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {yearly ? priceCard.yearly : priceCard.monthly}
                    </p>
                    {yearly ? <p className="mt-0.5 text-[10px] text-[#4A8CB5]">faktureres årligt</p> : null}
                    <p className="mt-2 text-[10px] text-[#4A8CB5]">{priceCard.fits}</p>
                    <ul className="mt-4 flex-1 space-y-3 text-base text-[#2C4A5E]">
                      {priceCard.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-sky-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/priser"
                      className={`mt-4 inline-flex w-full justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                        priceCard.highlight
                          ? "bg-sky-600 text-white hover:bg-sky-700"
                          : "border border-sky-200 text-sky-700 hover:bg-sky-50"
                      }`}
                    >
                      Vælg {priceCard.name}
                    </Link>
                  </article>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/priser" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              Se alle features →
            </Link>
            <p className="mt-2 text-[10px] text-[#4A8CB5]">
              Ingen binding · Opsig når som helst · Kom i gang på 10 minutter
            </p>
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative z-10 border-t border-black/5 bg-[#062840] py-24"
      >
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">Klar til at få IT ud af vejen?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-white/80">
            Book en gratis snak på 30 minutter. Vi gennemgår platformen og sætter det op til jer – samme dag.
          </p>
          <div className="flex justify-center">
            <Link
              href="/kontakt"
              className="rounded-full bg-sky-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
            >
              Book en gratis snak
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/70">30 min · gratis · uforpligtende · ingen binding</p>
        </div>
      </section>
    </main>
  );
}
