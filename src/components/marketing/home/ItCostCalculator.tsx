"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight, Loader2, Search } from "lucide-react";
import {
  type CalculationResult,
  type CriticalSystem,
  CRITICAL_SYSTEMS,
  type CvrCompany,
  type EmployeeBucket,
  type ItProblemsFrequency,
  calculateItRisk,
  employeeBucketFromCount,
  formatKr,
  naceCodeToSection,
  SYSTEMKLAR_YEARLY_KR,
  type WebsiteType,
} from "@/lib/it-cost-calculator";

const STEPS = [1, 2, 3] as const;

const WEBSITE_OPTIONS: { id: WebsiteType; label: string }[] = [
  { id: "info", label: "Kun informationsside" },
  { id: "webshop", label: "Webshop med salg" },
  { id: "both", label: "Begge" },
  { id: "none", label: "Ingen" },
];

const EMPLOYEE_OPTIONS: { id: EmployeeBucket; label: string }[] = [
  { id: "under5", label: "Under 5" },
  { id: "5-20", label: "5–20" },
  { id: "21-50", label: "21–50" },
  { id: "over50", label: "Over 50" },
];

const PROBLEM_OPTIONS: { id: ItProblemsFrequency; label: string }[] = [
  { id: "never", label: "Nej" },
  { id: "few", label: "1–2 gange" },
  { id: "several", label: "Flere gange" },
  { id: "often", label: "Ofte" },
];

function useCountUp(target: number, active: boolean, durationMs = 1400) {
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

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mb-10 flex items-center justify-center gap-2" aria-label="Trin">
      {STEPS.map((step, index) => {
        const done = current > step;
        const active = current === step;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-[#1E3448]"
                  : done
                    ? "bg-[#4A7FA5] text-white"
                    : "border border-white/30 text-white/50"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : step}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                className={`h-px w-8 sm:w-12 ${done || active ? "bg-white/60" : "bg-white/20"}`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ChoiceButton({
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
      className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
        selected
          ? "border-white bg-white text-[#1E3448]"
          : "border-white/40 bg-transparent text-white hover:border-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function StepPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}

export function ItCostCalculator() {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CvrCompany[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [company, setCompany] = useState<CvrCompany | null>(null);
  const [employeeCount, setEmployeeCount] = useState(5);

  const [website, setWebsite] = useState<WebsiteType | null>(null);
  const [employeeBucket, setEmployeeBucket] = useState<EmployeeBucket | null>(null);
  const [criticalSystems, setCriticalSystems] = useState<CriticalSystem[]>([]);
  const [problems, setProblems] = useState<ItProblemsFrequency | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [wageFromDst, setWageFromDst] = useState(true);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectCompany = useCallback((item: CvrCompany) => {
    setCompany(item);
    setQuery(item.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchError(null);
    const count = item.employees > 0 ? item.employees : 5;
    setEmployeeCount(count);
    setEmployeeBucket(employeeBucketFromCount(count));
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
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        setSearchError("Kunne ikke søge i CVR. Prøv igen.");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, company]);

  const step2Complete =
    website !== null && employeeBucket !== null && problems !== null;

  const runCalculation = async () => {
    if (!company || !employeeBucket || !problems) return;

    setCalculating(true);
    const branche07 = naceCodeToSection(company.industrycode);

    let hourlyWage = 350;
    let fromDst = false;
    try {
      const res = await fetch(`/api/marketing/timelon?branche07=${encodeURIComponent(branche07)}`);
      const data = await res.json();
      if (res.ok && typeof data.hourly === "number") {
        hourlyWage = data.hourly;
        fromDst = data.source === "dst";
      }
    } catch {
      /* fallback */
    }

    const calc = calculateItRisk({
      employees: employeeCount,
      hourlyWage,
      industrycode: company.industrycode,
      industryLabel: company.industry,
      criticalSystems,
      problems,
    });

    setResult({ ...calc, wageFromDst: fromDst });
    setWageFromDst(fromDst);
    setCalculating(false);
    setStep(3);
  };

  const animatedRisk = useCountUp(result?.tabPerYear ?? 0, step === 3 && !!result);
  const animatedSavings = useCountUp(result?.savings ?? 0, step === 3 && !!result);

  const employeesForDisplay = useMemo(() => employeeCount, [employeeCount]);

  return (
    <section id="it-beregner" className="scroll-mt-24 bg-[#1E3448] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-light tracking-tight text-white md:text-4xl">
            Hvad koster IT-nedetid din virksomhed?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#7A9AB0]">
            Indtast jeres CVR-nummer og besvare et par spørgsmål — vi beregner jeres reelle IT-risiko
            baseret på offentlige data
          </p>
        </div>

        <StepIndicator current={step} />

        <div ref={wrapperRef} className="relative min-h-[320px]">
          <StepPanel visible={step === 1}>
            <div className="rounded-2xl bg-white p-6 md:p-8">
              <label htmlFor="cvr-search" className="text-sm font-medium text-[#1E3448]">
                CVR-nummer eller virksomhedsnavn
              </label>
              <div className="relative mt-3">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A9AB0]"
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
                  placeholder="Fx 12345678 eller firmanavn"
                  autoComplete="off"
                  className="w-full rounded-xl border border-[#E0EAF0] bg-white py-3.5 pl-11 pr-4 text-[#1E3448] outline-none ring-[#4A7FA5] placeholder:text-[#7A9AB0] focus:ring-2"
                />
                {searching ? (
                  <Loader2
                    className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#4A7FA5]"
                    aria-hidden
                  />
                ) : null}
                {showSuggestions && suggestions.length > 0 ? (
                  <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-[#E0EAF0] bg-white shadow-lg">
                    {suggestions.map((item) => (
                      <li key={item.cvr}>
                        <button
                          type="button"
                          onClick={() => selectCompany(item)}
                          className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-[#F7F4EF]"
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
              </div>
              {searchError ? <p className="mt-2 text-sm text-red-600">{searchError}</p> : null}

              {company ? (
                <div className="mt-6 rounded-xl border border-[#E0EAF0] bg-[#F7F4EF] p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#4A7FA5]">
                    Valgt virksomhed
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-[#7A9AB0]">Firmanavn</label>
                      <p className="mt-1 text-sm font-medium text-[#1E3448]">{company.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-[#7A9AB0]">Branche</label>
                      <p className="mt-1 text-sm text-[#4A6478]">{company.industry}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="employee-count" className="text-xs text-[#7A9AB0]">
                        Antal ansatte
                      </label>
                      <input
                        id="employee-count"
                        type="number"
                        min={1}
                        max={9999}
                        value={employeeCount}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10) || 1;
                          setEmployeeCount(n);
                          setEmployeeBucket(employeeBucketFromCount(n));
                        }}
                        className="mt-1 w-full max-w-[140px] rounded-xl border border-[#E0EAF0] bg-white px-3 py-2 text-sm text-[#1E3448] outline-none focus:ring-2 focus:ring-[#4A7FA5]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#4A7FA5] px-8 text-sm font-medium text-white transition-colors hover:bg-[#3A6F95]"
                  >
                    Fortsæt
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </StepPanel>

          <StepPanel visible={step === 2}>
            <div className="space-y-6 rounded-2xl bg-white/10 p-6 md:p-8">
              <div>
                <p className="text-sm font-medium text-white">Har I en hjemmeside eller webshop?</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {WEBSITE_OPTIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.id}
                      selected={website === opt.id}
                      onClick={() => setWebsite(opt.id)}
                    >
                      {opt.label}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Hvor mange ansatte bruger IT dagligt?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EMPLOYEE_OPTIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.id}
                      selected={employeeBucket === opt.id}
                      onClick={() => {
                        setEmployeeBucket(opt.id);
                        const defaults = { under5: 3, "5-20": 12, "21-50": 35, over50: 60 };
                        if (!company || employeeCount === company.employees) {
                          setEmployeeCount(defaults[opt.id]);
                        }
                      }}
                    >
                      {opt.label}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white">Hvilke systemer er kritiske?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CRITICAL_SYSTEMS.map((system) => {
                    const selected = criticalSystems.includes(system);
                    return (
                      <button
                        key={system}
                        type="button"
                        onClick={() =>
                          setCriticalSystems((prev) =>
                            selected ? prev.filter((s) => s !== system) : [...prev, system],
                          )
                        }
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selected
                            ? "border-white bg-white text-[#1E3448]"
                            : "border-white/40 text-white hover:border-white/70"
                        }`}
                      >
                        {system}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Har I oplevet IT-problemer det seneste år?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PROBLEM_OPTIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.id}
                      selected={problems === opt.id}
                      onClick={() => setProblems(opt.id)}
                    >
                      {opt.label}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/40 px-6 text-sm font-medium text-white hover:border-white"
                >
                  Tilbage
                </button>
                <button
                  type="button"
                  disabled={!step2Complete || calculating}
                  onClick={() => void runCalculation()}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#4A7FA5] px-8 text-sm font-medium text-white transition-colors hover:bg-[#3A6F95] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Beregner…
                    </>
                  ) : (
                    "Beregn IT-risiko"
                  )}
                </button>
              </div>
            </div>
          </StepPanel>

          <StepPanel visible={step === 3 && !!result}>
            {result && company ? (
              <div className="rounded-2xl bg-white p-6 md:p-8">
                <p className="text-center text-sm text-[#4A6478]">
                  Estimeret IT-risiko for{" "}
                  <span className="font-medium text-[#1E3448]">{company.name}</span>
                </p>
                <p className="mt-4 text-center text-4xl font-light text-[#1E3448] md:text-5xl">
                  {formatKr(animatedRisk)} kr/år
                </p>

                <ul className="mt-8 space-y-2 border-t border-[#E0EAF0] pt-6 text-sm text-[#4A6478]">
                  <li>
                    Baseret på {employeesForDisplay} ansatte i {result.industryLabel}
                  </li>
                  <li>
                    Gennemsnitlig timeløn: {formatKr(result.hourlyWage)} kr/time
                    {wageFromDst ? " (Danmarks Statistik 2023)" : " (estimat)"}
                  </li>
                  <li>IT-afhængighed for branchen: {result.itDependencyPct}%</li>
                  <li>Estimeret nedetid: {result.downtimeHours} timer/år</li>
                </ul>

                <div className="mt-8 rounded-xl border border-[#E0EAF0] bg-[#F7F4EF] p-5">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#4A6478]">IT-risiko</span>
                    <span className="font-medium text-[#1E3448]">{formatKr(result.tabPerYear)} kr/år</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 text-sm">
                    <span className="text-[#4A6478]">Systemklar</span>
                    <span className="font-medium text-[#1E3448]">
                      fra {formatKr(SYSTEMKLAR_YEARLY_KR)} kr/år
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between gap-4 border-t border-[#E0EAF0] pt-4 text-sm">
                    <span className="font-medium text-[#1E3448]">Potentiel besparelse</span>
                    <span className="font-semibold text-[#4A7FA5]">
                      op til {formatKr(animatedSavings)} kr/år
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="mt-8 flex min-h-[52px] items-center justify-center rounded-full bg-[#4A7FA5] px-8 text-sm font-medium text-white transition-colors hover:bg-[#3A6F95]"
                >
                  Beskyt din virksomhed for 499 kr/md →
                </Link>

                <p className="mt-6 text-center text-xs leading-relaxed text-[#7A9AB0]">
                  Estimat baseret på CVR-data og Danmarks Statistik lønstatistik 2023. Beregningen er
                  vejledende.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setCompany(null);
                    setQuery("");
                    setWebsite(null);
                    setEmployeeBucket(null);
                    setCriticalSystems([]);
                    setProblems(null);
                  }}
                  className="mt-4 w-full text-center text-sm text-[#4A7FA5] hover:underline"
                >
                  Beregn for en anden virksomhed
                </button>
              </div>
            ) : null}
          </StepPanel>
        </div>
      </div>
    </section>
  );
}

