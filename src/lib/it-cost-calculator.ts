/** NACE Rev. 2 section letter from industry code (e.g. 620100 → J). */
export function naceCodeToSection(industrycode: number | string): string {
  const code = String(industrycode).replace(/\D/g, "").padStart(6, "0");
  const division = parseInt(code.slice(0, 2), 10) || 0;

  if (division >= 1 && division <= 3) return "A";
  if (division >= 5 && division <= 9) return "B";
  if (division >= 10 && division <= 33) return "C";
  if (division === 35) return "D";
  if (division >= 36 && division <= 39) return "E";
  if (division >= 41 && division <= 43) return "F";
  if (division >= 45 && division <= 47) return "G";
  if (division >= 49 && division <= 53) return "H";
  if (division >= 55 && division <= 56) return "I";
  if (division >= 58 && division <= 63) return "J";
  if (division >= 64 && division <= 66) return "K";
  if (division === 68) return "L";
  if (division >= 69 && division <= 75) return "M";
  if (division >= 77 && division <= 82) return "N";
  if (division === 84) return "O";
  if (division === 85) return "P";
  if (division >= 86 && division <= 88) return "Q";
  if (division >= 90 && division <= 93) return "R";
  if (division >= 94 && division <= 96) return "S";
  if (division >= 97 && division <= 98) return "T";
  if (division === 99) return "U";
  return "X";
}

const SECTION_IT_DEPENDENCY: Record<string, number> = {
  A: 0.35,
  B: 0.7,
  C: 0.7,
  D: 0.7,
  E: 0.7,
  F: 0.6,
  G: 0.85,
  H: 0.7,
  I: 0.6,
  J: 0.95,
  K: 0.95,
  L: 0.65,
  M: 0.9,
  N: 0.8,
  O: 0.7,
  P: 0.7,
  Q: 0.75,
  R: 0.65,
  S: 0.7,
  T: 0.7,
  U: 0.7,
  X: 0.7,
};

/** IT-afhængighed from NACE — wholesale (46) uses 0.75 per spec. */
export function getItDependency(industrycode: number): number {
  const code = String(industrycode).replace(/\D/g, "").padStart(6, "0");
  const division = parseInt(code.slice(0, 2), 10) || 0;
  if (division === 46) return 0.75;
  if (division === 47) return 0.85;
  if (division >= 45 && division <= 47) return 0.85;
  const section = naceCodeToSection(industrycode);
  return SECTION_IT_DEPENDENCY[section] ?? 0.7;
}

export type EmployeeBucket = "under5" | "5-20" | "21-50" | "over50";

export function employeeBucketFromCount(count: number): EmployeeBucket {
  if (count < 5) return "under5";
  if (count <= 20) return "5-20";
  if (count <= 50) return "21-50";
  return "over50";
}

export function employeeCountFromBucket(bucket: EmployeeBucket): number {
  switch (bucket) {
    case "under5":
      return 3;
    case "5-20":
      return 12;
    case "21-50":
      return 35;
    case "over50":
      return 60;
  }
}

export const CRITICAL_SYSTEMS = [
  "Regnskab",
  "Email",
  "Webshop",
  "Filserver",
  "Betalingsløsning",
  "CRM",
] as const;

export type CriticalSystem = (typeof CRITICAL_SYSTEMS)[number];

export type WebsiteType = "info" | "webshop" | "both" | "none";
export type ItProblemsFrequency = "never" | "few" | "several" | "often";

export const DOWNTIME_HOURS: Record<ItProblemsFrequency, number> = {
  never: 1,
  few: 4,
  several: 12,
  often: 30,
};

export const SYSTEMKLAR_YEARLY_KR = 499 * 12;

export type CalculationInput = {
  employees: number;
  hourlyWage: number;
  industrycode: number;
  industryLabel: string;
  criticalSystems: CriticalSystem[];
  problems: ItProblemsFrequency;
};

export type CalculationResult = {
  tabPerYear: number;
  hourlyWage: number;
  wageFromDst: boolean;
  employees: number;
  industryLabel: string;
  itDependency: number;
  itDependencyPct: number;
  downtimeHours: number;
  systemklarYearly: number;
  savings: number;
  branche07: string;
};

export function calculateItRisk(input: CalculationInput): CalculationResult {
  const baseDependency = getItDependency(input.industrycode);
  const systemBonus = Math.min(input.criticalSystems.length * 0.05, 1 - baseDependency);
  const itDependency = Math.min(baseDependency + systemBonus, 1);
  const downtimeHours = DOWNTIME_HOURS[input.problems];
  const tabPerYear = Math.round(
    input.employees * input.hourlyWage * itDependency * downtimeHours,
  );
  const savings = Math.max(0, tabPerYear - SYSTEMKLAR_YEARLY_KR);

  return {
    tabPerYear,
    hourlyWage: input.hourlyWage,
    wageFromDst: true,
    employees: input.employees,
    industryLabel: input.industryLabel,
    itDependency,
    itDependencyPct: Math.round(itDependency * 100),
    downtimeHours,
    systemklarYearly: SYSTEMKLAR_YEARLY_KR,
    savings,
    branche07: naceCodeToSection(input.industrycode),
  };
}

export function formatKr(value: number): string {
  return new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(value);
}

export type CvrCompany = {
  name: string;
  cvr: string;
  city: string;
  industry: string;
  employees: number;
  industrycode: number;
};

export function mapCvrApiResult(data: Record<string, unknown>): CvrCompany {
  const industrycode =
    typeof data.industrycode === "number"
      ? data.industrycode
      : parseInt(String(data.industrycode ?? "0"), 10) || 0;

  return {
    name: String(data.name ?? ""),
    cvr: String(data.vat ?? data.cvr ?? ""),
    city: String(data.city ?? ""),
    industry: String(data.industrydesc ?? data.industry ?? "Ukendt branche"),
    employees:
      typeof data.employees === "number"
        ? data.employees
        : parseInt(String(data.employees ?? "0"), 10) || 0,
    industrycode,
  };
}
