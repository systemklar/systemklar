"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Building,
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
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { DemoModal } from "@/components/ui/DemoModal";

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
    features: [
      "IT-overblik",
      "Support & sager",
      "Sikker kodebank",
      "Månedlig IT-rapport",
      "Op til 3 teammedlemmer",
    ],
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

const BRANCH_HOURLY_RATE: Record<string, number> = {
  haandvaerk: 315,
  handel: 295,
  kontor: 425,
  sundhed: 385,
  transport: 310,
  andet: 350,
};

type CvrResult = {
  name: string;
  cvr: string;
  city: string;
  industry: string;
  employees: number;
  industrycode: number;
};

type CvrApiItem = {
  name?: string;
  vat?: string | number;
  cvr?: string | number;
  city?: string;
  industrydesc?: string;
  industrycode?: string | number;
  employees?: number;
  error?: string | boolean;
};

function mapCvrResult(d: CvrApiItem): CvrResult {
  return {
    name: d.name ?? "",
    cvr: String(d.vat ?? d.cvr ?? ""),
    city: d.city ?? "",
    industry: d.industrydesc ?? "",
    employees: d.employees ?? 0,
    industrycode: Number(d.industrycode ?? 0),
  };
}

const itSpendOptions = [
  { value: 0, icon: Building2, title: "Under 500 kr", subtitle: "Næsten ingen IT-udgifter" },
  { value: 1250, icon: TrendingUp, title: "500–2.000 kr", subtitle: "Lidt ekstern hjælp" },
  { value: 4000, icon: Briefcase, title: "2.000–6.000 kr", subtitle: "Fast IT-konsulent" },
  { value: 6000, icon: Building, title: "Over 6.000 kr", subtitle: "Større IT-setup" },
] as const;

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
  const [showDemoModal, setShowDemoModal] = useState(false);

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
  const [cvrResults, setCvrResults] = useState<CvrResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const cvrSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentItSpend, setCurrentItSpend] = useState<number | null>(null);
  const [showEstimateInfo, setShowEstimateInfo] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPriceFading(true), 0);
    const restoreTimer = window.setTimeout(() => setPriceFading(false), 250);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(restoreTimer);
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
  const hourlyRate = BRANCH_HOURLY_RATE[selectedIndustry ?? "andet"] ?? 350;
  const weeklyWaste = employeeCount * wasteHoursPerPerson * frequencyMultiplier;
  const monthlyWasteHours = Math.round(weeklyWaste * 4);
  const monthlyWasteCost = Math.round(weeklyWaste * 4 * hourlyRate * industryMultiplier * setupMultiplier);
  const currentItCost = currentItSpend ?? 0;
  const totalMonthlyBurden = monthlyWasteCost + currentItCost;
  const systemklarSavings = Math.round(totalMonthlyBurden * 0.7);
  const consultantSavings = selectedSetup === "konsulent" ? employeeCount * 150 : 0;
  const plan =
    employeeCount <= 5
      ? { name: "Starter", price: 499 }
      : employeeCount <= 15
        ? { name: "Plus", price: 1299 }
        : { name: "Pro", price: 2499 };
  const netGain = systemklarSavings - plan.price;
  const resultHours = useCountUp(monthlyWasteHours, 1000, calculatorStep === 7);
  const resultLost = useCountUp(monthlyWasteCost, 1000, calculatorStep === 7);
  const resultSavings = useCountUp(systemklarSavings, 1000, calculatorStep === 7);
  const resultNet = useCountUp(Math.abs(netGain), 1000, calculatorStep === 7);
  const resultConsultant = useCountUp(consultantSavings, 1000, calculatorStep === 7);
  const resultItCost = useCountUp(currentItCost, 1000, calculatorStep === 7);
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

  const handleItSpendSelect = (value: number) => {
    setCurrentItSpend(value);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(4), 500);
  };

  const handleSetupSelect = (id: (typeof setupOptions)[number]["id"]) => {
    setSelectedSetup(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(5), 500);
  };

  const handleFrequencySelect = (id: (typeof frequencyOptions)[number]["id"]) => {
    setSelectedFrequency(id);
    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(6), 500);
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
    setCvrResults([]);
    setShowDropdown(false);
    setCurrentItSpend(null);
    setShowEstimateInfo(false);
    setCalculatorStep(0);
  };

  type EmployeeId = (typeof employeeOptions)[number]["id"];
  type IndustryId = (typeof industryOptions)[number]["id"];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target?.closest(".cvr-dropdown-wrapper")) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (cvrSearchTimeoutRef.current) clearTimeout(cvrSearchTimeoutRef.current);
    };
  }, []);

  const searchCvr = async (query: string) => {
    setCvrLoading(true);
    setCvrError(null);
    try {
      const res = await fetch(
        `https://cvrapi.dk/api?search=${encodeURIComponent(query.trim())}&country=dk&maxresults=8`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) throw new Error();
      const data: unknown = await res.json();
      const results: CvrResult[] = Array.isArray(data)
        ? (data as CvrApiItem[]).map(mapCvrResult)
        : (data as CvrApiItem).error
          ? []
          : [mapCvrResult(data as CvrApiItem)];
      setCvrResults(results);
      setShowDropdown(results.length > 0);
    } catch {
      setCvrResults([]);
    } finally {
      setCvrLoading(false);
    }
  };

  const handleCvrInput = (value: string) => {
    setCvrInput(value);
    setCvrError(null);
    setCvrData(null);
    setShowDropdown(false);
    if (cvrSearchTimeoutRef.current) clearTimeout(cvrSearchTimeoutRef.current);
    if (value.trim().length < 2) {
      setCvrResults([]);
      return;
    }
    cvrSearchTimeoutRef.current = setTimeout(() => searchCvr(value), 400);
  };

  const selectCvrResult = (result: CvrResult) => {
    setShowDropdown(false);
    setCvrResults([]);
    setCvrInput(result.name);

    let employeeCategory: EmployeeId = "1-5";
    if (result.employees >= 30) employeeCategory = "30+";
    else if (result.employees >= 16) employeeCategory = "16-30";
    else if (result.employees >= 6) employeeCategory = "6-15";
    setSelectedEmployees(employeeCategory);

    const code = String(result.industrycode);
    let mappedIndustry: IndustryId = "andet";
    if (["41", "42", "43"].some((p) => code.startsWith(p))) mappedIndustry = "haandvaerk";
    else if (["45", "46", "47"].some((p) => code.startsWith(p))) mappedIndustry = "handel";
    else if (["49", "50", "51", "52", "53"].some((p) => code.startsWith(p))) mappedIndustry = "transport";
    else if (["86", "87", "88"].some((p) => code.startsWith(p))) mappedIndustry = "sundhed";
    else if (["69", "70", "71", "72", "73", "74", "75"].some((p) => code.startsWith(p))) mappedIndustry = "kontor";
    setSelectedIndustry(mappedIndustry);

    setCvrData({ name: result.name, employees: result.employees, industry: result.industry });

    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    stepDelayRef.current = window.setTimeout(() => setCalculatorStep(1), 800);
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

  const stepCardClass = (active: boolean, pulse = true) =>
    `relative flex flex-col items-start rounded-2xl p-4 text-left transition-all duration-200 ${
      active
        ? `border border-sky-400/50 bg-sky-500/20 ring-1 ring-sky-400/30${pulse ? " animate-pulse" : ""}`
        : "cursor-pointer border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
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

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-t border-black/5 bg-gradient-to-br from-[#0A6EBD] to-[#062840] py-0">
        <div
          className="dot-drift absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p
            className="fade-in-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            Bygget til danske SMV&apos;er – uden IT-afdeling
          </p>
          <AnimatedSection direction="up" delay={0}>
            <h1 className="mb-3 mt-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
              Få styr på IT.
              <br />
              Brug tiden på din forretning.
            </h1>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={100}>
            <p className="mx-auto mb-6 max-w-2xl text-base text-white/80 md:text-xl">
              systemklar samler support, systemoverblik og IT-dokumentation ét sted – så du aldrig igen skal jagte
              adgangskoder eller vente på IT-hjælp.
            </p>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={200}>
            <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={() => document.getElementById("roi-beregner")?.scrollIntoView({ behavior: "smooth" })}
                className="min-h-[44px] rounded-full bg-white px-8 py-4 text-base font-semibold text-[#0A6EBD] transition-all hover:bg-white/90"
              >
                Se hvad IT-rod koster jer
              </button>
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="min-h-[44px] rounded-full border border-white/40 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Book en gratis snak
              </button>
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

      <section className="relative z-10 border-t border-black/5 bg-[#F0F7FF] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">
            Alt på ét sted – præcis som det er
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-[#2C4A5E] md:text-lg">
            Se hvordan platformen ser ud i praksis – med et overblik du kan forstå med det samme.
          </p>
        </div>
        <div className="mx-auto max-w-2xl px-6">
          <AnimatedSection direction="up">
            <div className="hidden overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md md:block">
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
          <div className="mt-8 text-center">
            <Link
              href="/platformen"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
            >
              Se alt hvad platformen kan
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section id="roi-beregner" className="relative z-10 bg-white py-16 md:py-24">
        <div className="mb-12 px-6 text-center">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Gratis beregner
          </span>
          <h2 className="mb-3 mt-4 text-2xl font-extrabold text-[#0D1F2D] md:text-4xl">
            Hvad koster IT-rod
            <br />
            din virksomhed?
          </h2>
          <p className="mx-auto max-w-lg text-base text-[#4A8CB5]">
            Besvar 7 spørgsmål og få et præcist svar på hvad IT-rod koster jer.
          </p>
        </div>
        <div className="mx-auto max-w-2xl px-4 md:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-sky-500/20 to-[#0A3D5C]/40 p-[1px]">
            <div className="rounded-[23px] bg-[#0A2535] p-5 md:p-8">
              <div className="mb-8 flex items-center justify-center gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === calculatorStep
                        ? "h-2 w-6 bg-sky-400"
                        : i < calculatorStep
                          ? "h-2 w-2 bg-sky-600"
                          : "h-2 w-2 bg-white/20"
                    }`}
                  />
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
                  <h3 className="mb-1 text-lg font-semibold text-white">Hvad hedder din virksomhed?</h3>
                  <p className="mb-5 text-sm text-white/50">
                    Begynd at skrive virksomhedsnavn eller CVR – vi finder resten automatisk.
                  </p>
                  <div className="cvr-dropdown-wrapper relative">
                    <input
                      type="text"
                      value={cvrInput}
                      onChange={(e) => handleCvrInput(e.target.value)}
                      onFocus={() => {
                        if (cvrResults.length > 0) setShowDropdown(true);
                      }}
                      placeholder="CVR-nummer eller virksomhedsnavn..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/50"
                    />
                    {cvrLoading ? (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 animate-spin text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      </div>
                    ) : null}
                    {showDropdown && cvrResults.length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0A2535] shadow-xl">
                        <div className="border-b border-white/5 px-4 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-white/30">
                            {cvrResults.length} resultater
                          </p>
                        </div>
                        {cvrResults.map((r, i) => (
                          <button
                            key={`${r.cvr}-${i}`}
                            type="button"
                            onClick={() => selectCvrResult(r)}
                            className="w-full border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{r.name}</p>
                                <p className="mt-0.5 text-xs text-white/40">
                                  CVR {r.cvr}
                                  {r.city ? ` · ${r.city}` : ""}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="max-w-[120px] truncate text-xs text-white/30">{r.industry}</p>
                                {r.employees > 0 ? (
                                  <p className="mt-0.5 text-[10px] text-white/20">{r.employees} ansatte</p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {cvrError ? <p className="mt-2 text-xs text-red-400">{cvrError}</p> : null}
                  {cvrData && !showDropdown ? (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-green-400/30 bg-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{cvrData.name}</p>
                        <p className="text-xs text-white/50">
                          {cvrData.employees} ansatte · {cvrData.industry}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCalculatorStep(1)}
                    className="mt-4 block w-full text-center text-xs text-white/30 transition-colors hover:text-white/60"
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
                  <h3 className="mb-5 text-lg font-semibold text-white">Hvor mange ansatte har I?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {employeeOptions.map((option) => {
                      const active = selectedEmployees === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleEmployeeSelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          {active && cvrData ? (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-400/30 bg-sky-500/30 px-2 py-0.5 text-[9px] font-semibold text-sky-300">
                              Fra CVR
                            </span>
                          ) : null}
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Users className={`h-4 w-4 ${active ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p
                            className={`text-sm font-semibold ${active ? "text-sky-200" : "text-white"}`}
                          >
                            {option.label}
                          </p>
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
                  <h3 className="mb-5 text-lg font-semibold text-white">Hvad laver din virksomhed?</h3>
                  <div className="grid grid-cols-2 gap-3">
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
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-400/30 bg-sky-500/30 px-2 py-0.5 text-[9px] font-semibold text-sky-300">
                              Fra CVR
                            </span>
                          ) : null}
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Icon className={`h-4 w-4 ${active ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p
                            className={`text-sm font-semibold ${active ? "text-sky-200" : "text-white"}`}
                          >
                            {option.title}
                          </p>
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
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    Hvad betaler I ca. for IT-hjælp og systemer om måneden?
                  </h3>
                  <p className="mb-5 text-sm text-white/50">Inkludér konsulenter, software og support</p>
                  <div className="grid grid-cols-2 gap-3">
                    {itSpendOptions.map((option) => {
                      const Icon = option.icon;
                      const active = currentItSpend === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleItSpendSelect(option.value)}
                          className={stepCardClass(active)}
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Icon className={`h-4 w-4 ${active ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p className={`text-sm font-semibold ${active ? "text-sky-200" : "text-white"}`}>
                            {option.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/40">{option.subtitle}</p>
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
                  <h3 className="mb-5 text-lg font-semibold text-white">Hvordan håndterer I IT i dag?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {setupOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedSetup === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSetupSelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Icon className={`h-4 w-4 ${active ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p
                            className={`text-sm font-semibold ${active ? "text-sky-200" : "text-white"}`}
                          >
                            {option.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/40">{option.subtitle}</p>
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
                  <h3 className="mb-5 text-lg font-semibold text-white">Hvor tit oplever I IT-problemer?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {frequencyOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedFrequency === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleFrequencySelect(option.id)}
                          className={stepCardClass(active)}
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Icon className={`h-4 w-4 ${active ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p
                            className={`text-sm font-semibold ${active ? "text-sky-200" : "text-white"}`}
                          >
                            {option.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/40">{option.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 6
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="mb-1 text-lg font-semibold text-white">Hvad bruger I unødigt tid på?</h3>
                  <p className="mb-5 text-sm text-white/50">Vælg alle der passer</p>
                  <div className="grid grid-cols-2 gap-3">
                    {wasteOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = selectedWaste.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleWaste(option.id)}
                          className={stepCardClass(selected, false)}
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                            <Icon className={`h-4 w-4 ${selected ? "text-sky-300" : "text-white/70"}`} />
                          </div>
                          <p
                            className={`text-sm font-semibold ${selected ? "text-sky-200" : "text-white"}`}
                          >
                            {option.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/40">{option.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCalculatorStep(7)}
                    disabled={selectedWaste.length === 0}
                    className="mt-4 w-full rounded-2xl bg-sky-500 py-4 font-semibold text-white transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Beregn resultat
                  </button>
                </div>

                <div
                  className={`transition-all duration-[400ms] ${
                    calculatorStep === 7
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
                  }`}
                >
                  <AnimatedSection direction="up">
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <p className="text-sm font-semibold text-white">Her er jeres IT-regning</p>
                      <button
                        type="button"
                        onClick={() => setShowEstimateInfo(!showEstimateInfo)}
                        aria-expanded={showEstimateInfo}
                        aria-label="Sådan beregner vi"
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-bold text-white/50 transition-all hover:bg-white/20 hover:text-white/80"
                      >
                        i
                      </button>
                    </div>
                    {showEstimateInfo ? (
                      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                        <p className="mb-2 text-xs font-semibold text-white/70">Om denne beregning</p>
                        <ul className="space-y-1.5 text-[11px] leading-relaxed text-white/50">
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0 text-sky-400">·</span>
                            Timeløn baseret på Danmarks Statistiks lønstatistik for branchen (
                            {BRANCH_HOURLY_RATE[selectedIndustry ?? "andet"]} kr/t)
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0 text-sky-400">·</span>
                            Tidsspild baseret på undersøgelser af IT-tidsspild i danske SMV&apos;er
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0 text-sky-400">·</span>
                            Virksomhedsdata hentet fra Det Centrale Virksomhedsregister (CVR)
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0 text-sky-400">·</span>
                            Besparelse estimeret til 70% – konservativt baseret på kundeerfaringer
                          </li>
                        </ul>
                        <p className="mt-3 border-t border-white/10 pt-3 text-[10px] text-white/30">
                          Dette er et estimat. Faktiske besparelser afhænger af jeres specifikke situation.
                          systemklar påtager sig ikke ansvar for beregningens nøjagtighed.
                        </p>
                      </div>
                    ) : null}
                    {cvrData ? (
                      <p className="mb-5 text-center text-xs text-white/40">
                        Beregning for <span className="font-semibold text-white">{cvrData.name}</span>
                      </p>
                    ) : null}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                        <p className="text-2xl font-bold text-white">{formatNumber(resultHours)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">Timer / md.</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{formatNumber(resultLost)} kr</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">Tabt arbejdstid</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{formatNumber(resultSavings)} kr</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                          systemklar sparer
                        </p>
                      </div>
                      <div className="col-span-3 mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-xs text-white/40">
                          Nuværende IT-udgifter medregnet: {formatNumber(resultItCost)} kr/md
                        </p>
                      </div>
                    </div>
                    {contextLine ? <p className="mt-4 text-xs text-white/50">{contextLine}</p> : null}
                    <div className="my-5 border-t border-white/10" />
                    <div className="rounded-2xl border border-green-400/20 bg-green-500/10 p-5">
                      <p className="mb-3 text-sm font-semibold text-green-300">
                        Med {plan.name}-planen til {formatNumber(plan.price)} kr/md får I:
                      </p>
                      <ul className="space-y-2">
                        {selectedWaste.includes("passwords") ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>Sikker kodebank – find alle logins på sekunder</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("ventetid") ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>Support direkte i platformen – ingen ventetid</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("systemer") ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>Samlet systemoverblik – alt på ét sted</span>
                          </li>
                        ) : null}
                        {selectedWaste.includes("support") ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>Månedlig IT-rapport – vi forklarer det for dig</span>
                          </li>
                        ) : null}
                        {selectedSetup === "konsulent" ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>
                              Reducér jeres IT-konsulent udgifter med ca. {formatNumber(resultConsultant)} kr/md
                            </span>
                          </li>
                        ) : null}
                        {industryRecommendation ? (
                          <li className="flex items-start gap-2 text-xs text-white/70">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>{industryRecommendation}</span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    {selectedWaste.length === 0 && netGain <= 0 ? (
                      <p className="mt-5 text-center text-sm text-white/40">
                        Udfyld alle trin for at se dit resultat
                      </p>
                    ) : netGain > 0 ? (
                      <p className="mt-5 text-center text-xl font-bold text-green-400">
                        Netto gevinst: +{formatNumber(resultNet)} kr/md
                      </p>
                    ) : null}
                    {urgencyText ? (
                      <p className="mt-2 text-center text-xs text-white/50">{urgencyText}</p>
                    ) : null}
                    <Link
                      href="/kontakt"
                      className="mt-5 block w-full rounded-2xl bg-sky-500 py-4 text-center text-sm font-semibold text-white transition-all hover:bg-sky-400"
                    >
                      Book en gratis demo
                    </Link>
                    <p className="mt-3 text-center text-[10px] text-white/25">
                      Beregningen er baseret på Danmarks Statistiks branchelønnen ({hourlyRate} kr/t) og
                      dokumenteret IT-tidsspild i SMV&apos;er.
                    </p>
                    <button
                      onClick={resetCalculator}
                      className="mt-3 block w-full text-center text-xs text-white/30 transition-colors hover:text-white/60"
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

      <section className="relative z-10 border-t border-black/5 bg-[#062840] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-300">Hvad kunderne siger</p>
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Det siger vores kunder</h2>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-3 md:gap-8">
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-white md:col-span-2 md:p-8">
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
          <div className="flex flex-col gap-6 md:gap-8">
            {sideTestimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-1 flex-col justify-between rounded-2xl border border-white/10 bg-white/10 p-6 md:p-8"
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

      <section className="relative z-10 border-t border-black/5 bg-[#F0F7FF] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">Priser</h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-[#2C4A5E] md:text-lg">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
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
        className="relative z-10 border-t border-black/5 bg-[#062840] py-16 md:py-24"
      >
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-white md:text-3xl">Klar til at få IT ud af vejen?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-white/80 md:text-lg">
            Book en gratis snak på 30 minutter. Vi gennemgår platformen og sætter det op til jer – samme dag.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="min-h-[44px] rounded-full bg-sky-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
            >
              Book en gratis snak
            </button>
          </div>
          <p className="mt-3 text-xs text-white/70">30 min · gratis · uforpligtende · ingen binding</p>
        </div>
      </section>
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} subject="Demo" />
    </main>
  );
}
