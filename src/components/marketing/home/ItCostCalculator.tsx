"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  type CalculationResult,
  type CvrCompany,
  type ItProblemsLevel,
  type ItUsersBucket,
  type PrimaryItUse,
  calculateItRisk,
  formatKr,
  itUsersBucketFromCount,
  naceCodeToSection,
  primaryItUseFromNace,
} from "@/lib/it-cost-calculator";

const MAX_SUGGESTIONS = 4;

const PRIMARY_OPTIONS: { id: PrimaryItUse; label: string }[] = [
  { id: "webshop", label: "Webshop" },
  { id: "email", label: "Email & kontor" },
  { id: "accounting", label: "Regnskab" },
  { id: "production", label: "Produktion" },
  { id: "consulting", label: "Rådgivning" },
];

const USERS_OPTIONS: { id: ItUsersBucket; label: string }[] = [
  { id: "1-5", label: "1–5" },
  { id: "6-15", label: "6–15" },
  { id: "16-50", label: "16–50" },
  { id: "50+", label: "50+" },
];

const PROBLEM_OPTIONS: { id: ItProblemsLevel; label: string }[] = [
  { id: "none", label: "Ingen" },
  { id: "few", label: "Et par" },
  { id: "several", label: "Flere" },
  { id: "many", label: "Mange" },
];

function useCountUp(target: number, active: boolean, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs]);

  return value;
}

function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${
        selected
          ? "border-[#1E3448] bg-[#1E3448] text-white"
          : "border-[#C8D8E4] bg-white text-[#4A6478] hover:border-[#4A7FA5]/50"
      }`}
    >
      {children}
    </button>
  );
}

function StepFade({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-opacity duration-200 ${
        visible ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}

function CompanyPill({
  company,
  showBranch,
  onClear,
}: {
  company: CvrCompany;
  showBranch?: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EAF1F7] px-3 py-1.5 text-xs text-[#4A6478]">
        <span className="truncate">
          Valgt: <span className="font-medium text-[#1E3448]">{company.name}</span>
          {showBranch ? (
            <>
              {" "}
              · <span className="text-[#7A9AB0]">{company.industry}</span>
            </>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full p-0.5 text-[#7A9AB0] hover:bg-[#C8D8E4]/60 hover:text-[#1E3448]"
          aria-label="Skift virksomhed"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </div>
  );
}

export function ItCostCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CvrCompany[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [company, setCompany] = useState<CvrCompany | null>(null);

  const [primaryUse, setPrimaryUse] = useState<PrimaryItUse | null>(null);
  const [itUsers, setItUsers] = useState<ItUsersBucket | null>(null);
  const [problems, setProblems] = useState<ItProblemsLevel | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const resetAll = useCallback(() => {
    setStep(1);
    setQuery("");
    setCompany(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
    setPrimaryUse(null);
    setItUsers(null);
    setProblems(null);
    setResult(null);
    setCalculating(false);
  }, []);

  const clearCompany = useCallback(() => {
    setCompany(null);
    setQuery("");
    setPrimaryUse(null);
    setItUsers(null);
    setProblems(null);
    setStep(1);
  }, []);

  const selectCompany = useCallback((item: CvrCompany) => {
    setCompany(item);
    setQuery(item.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchError(null);

    const count = item.employees > 0 ? item.employees : 5;
    setPrimaryUse(primaryItUseFromNace(item.industrycode));
    setItUsers(itUsersBucketFromCount(count));
    setProblems("none");
    setStep(2);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() || query.length < 2 || (company && query === company.name)) {
      setSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/marketing/cvr-search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchError(data.error ?? "Kunne ikke søge i CVR");
          setSuggestions([]);
          return;
        }
        setSuggestions((data.results ?? []).slice(0, MAX_SUGGESTIONS));
        setShowSuggestions(true);
      } catch {
        setSearchError("Kunne ikke søge i CVR. Prøv igen.");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, company]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const step2Ready = primaryUse !== null && itUsers !== null && problems !== null;

  const runCalculation = async () => {
    if (!company || !primaryUse || !itUsers || !problems) return;

    setCalculating(true);
    const branche07 = naceCodeToSection(company.industrycode);

    let hourlyWage = 350;
    try {
      const res = await fetch(`/api/marketing/timelon?branche07=${encodeURIComponent(branche07)}`);
      const data = await res.json();
      if (res.ok && typeof data.hourly === "number") hourlyWage = data.hourly;
    } catch {
      /* fallback */
    }

    const calc = calculateItRisk({
      itUsers,
      hourlyWage,
      industrycode: company.industrycode,
      industryLabel: company.industry,
      primaryItUse: primaryUse,
      problems,
    });

    setResult(calc);
    setCalculating(false);
    setStep(3);
  };

  const animatedRisk = useCountUp(result?.tabPerYear ?? 0, step === 3 && !!result);
  const animatedSavings = useCountUp(result?.savings ?? 0, step === 3 && !!result);

  return (
    <section id="it-beregner" className="scroll-mt-24 bg-[#1E3448] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="text-2xl font-light tracking-tight text-white md:text-3xl">
          Hvad koster IT-nedetid din virksomhed?
        </h2>
        <p className="mt-2 text-sm text-[#7A9AB0]">
          Indtast CVR — få et hurtigt estimat på under et minut
        </p>
      </div>

      <div
        ref={cardRef}
        className="mx-auto mt-8 max-h-[500px] w-full max-w-[640px] overflow-hidden rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="relative min-h-[280px]">
          <StepFade visible={step === 1}>
            <label htmlFor="cvr-search" className="sr-only">
              CVR-nummer eller virksomhedsnavn
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A9AB0]"
                aria-hidden
              />
              <input
                id="cvr-search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCompany(null);
                  setSearchError(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="CVR-nummer eller virksomhedsnavn"
                autoComplete="off"
                className="w-full rounded-xl border border-[#C8D8E4] bg-white py-3 pl-10 pr-10 text-sm text-[#1E3448] outline-none placeholder:text-[#7A9AB0] focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/20"
              />
              {searching ? (
                <Loader2
                  className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#4A7FA5]"
                  aria-hidden
                />
              ) : null}
            </div>

            {searchError ? <p className="mt-2 text-xs text-red-600">{searchError}</p> : null}

            {showSuggestions && suggestions.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-xl border border-[#E0EAF0]">
                {suggestions.map((item) => (
                  <li key={item.cvr} className="border-b border-[#E0EAF0] last:border-0">
                    <button
                      type="button"
                      onClick={() => selectCompany(item)}
                      className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F4EF]"
                    >
                      <span className="text-sm font-medium text-[#1E3448]">{item.name}</span>
                      <span className="text-xs text-[#7A9AB0]">
                        CVR {item.cvr}
                        {item.city ? ` · ${item.city}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </StepFade>

          <StepFade visible={step === 2 && !!company}>
            {company ? (
              <>
                <CompanyPill company={company} onClear={clearCompany} />

                <div className="space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-xs font-medium text-[#4A6478]">Primær IT-brug</legend>
                    <div className="flex flex-wrap gap-2">
                      {PRIMARY_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={primaryUse === opt.id}
                          onClick={() => setPrimaryUse(opt.id)}
                        >
                          {opt.label}
                        </PillButton>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-medium text-[#4A6478]">Antal IT-brugere</legend>
                    <div className="flex flex-wrap gap-2">
                      {USERS_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={itUsers === opt.id}
                          onClick={() => setItUsers(opt.id)}
                        >
                          {opt.label}
                        </PillButton>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-medium text-[#4A6478]">
                      IT-problemer seneste år
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {PROBLEM_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.id}
                          selected={problems === opt.id}
                          onClick={() => setProblems(opt.id)}
                        >
                          {opt.label}
                        </PillButton>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <button
                  type="button"
                  disabled={!step2Ready || calculating}
                  onClick={() => void runCalculation()}
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#4A7FA5] text-sm font-medium text-white transition-colors hover:bg-[#3A6F95] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Beregner…
                    </>
                  ) : (
                    "Beregn min risiko →"
                  )}
                </button>
              </>
            ) : null}
          </StepFade>

          <StepFade visible={step === 3 && !!result && !!company}>
            {result && company ? (
              <div className="flex flex-col">
                <CompanyPill company={company} showBranch onClear={resetAll} />

                <div className="py-2 text-center">
                  <p className="text-4xl font-light tracking-tight text-[#1E3448] md:text-[2.75rem]">
                    {formatKr(animatedRisk)} kr
                  </p>
                  <p className="mt-1 text-sm text-[#7A9AB0]">estimeret IT-risiko per år</p>
                </div>

                <div className="mt-3 space-y-2 rounded-xl bg-[#F7F4EF] px-4 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4A6478]">Din risiko</span>
                    <span className="font-medium text-[#1E3448]">{formatKr(result.tabPerYear)} kr/år</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4A6478]">Systemklar</span>
                    <span className="font-medium text-[#1E3448]">fra 499 kr/md</span>
                  </div>
                  <p className="border-t border-[#E0EAF0] pt-2 text-center font-medium text-[#4A7FA5]">
                    Du kan spare op til {formatKr(animatedSavings)} kr/år
                  </p>
                </div>

                <Link
                  href="/login"
                  className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#4A7FA5] text-sm font-medium text-white transition-colors hover:bg-[#3A6F95]"
                >
                  Kom i gang →
                </Link>

                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-3 text-center text-xs text-[#4A7FA5] hover:underline"
                >
                  Beregn igen
                </button>

                <p className="mt-3 text-center text-[10px] leading-snug text-[#7A9AB0]">
                  Estimat baseret på CVR-data og Danmarks Statistik 2023. Vejledende beregning.
                </p>
              </div>
            ) : null}
          </StepFade>
        </div>
      </div>
    </section>
  );
}

