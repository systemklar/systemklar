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

export function getItDependency(industrycode: number): number {
  const code = String(industrycode).replace(/\D/g, "").padStart(6, "0");
  const division = parseInt(code.slice(0, 2), 10) || 0;
  if (division === 46) return 0.75;
  if (division === 47) return 0.85;
  if (division >= 45 && division <= 47) return 0.85;
  const section = naceCodeToSection(industrycode);
  return SECTION_IT_DEPENDENCY[section] ?? 0.7;
}

export type PrimaryItUse = "webshop" | "email" | "accounting" | "production" | "consulting";
export type ItUsersBucket = "1-5" | "6-15" | "16-50" | "50+";
export type ItProblemsLevel = "none" | "few" | "several" | "many";

const PRIMARY_IT_DEPENDENCY: Record<PrimaryItUse, number> = {
  webshop: 0.9,
  email: 0.7,
  accounting: 0.85,
  production: 0.75,
  consulting: 0.9,
};

export const DOWNTIME_HOURS: Record<ItProblemsLevel, number> = {
  none: 1,
  few: 4,
  several: 12,
  many: 30,
};

export function itUsersBucketFromCount(count: number): ItUsersBucket {
  if (count <= 5) return "1-5";
  if (count <= 15) return "6-15";
  if (count <= 50) return "16-50";
  return "50+";
}

export function employeeCountFromItUsers(bucket: ItUsersBucket): number {
  switch (bucket) {
    case "1-5":
      return 3;
    case "6-15":
      return 10;
    case "16-50":
      return 30;
    case "50+":
      return 75;
  }
}

/** Map NACE industry code to suggested primary IT use. */
export function primaryItUseFromNace(industrycode: number): PrimaryItUse {
  const division = parseInt(String(industrycode).replace(/\D/g, "").slice(0, 2), 10) || 0;

  if (division === 47) return "webshop";
  if (division >= 45 && division <= 47) return "webshop";
  if (division >= 10 && division <= 33) return "production";
  if (division >= 64 && division <= 66) return "accounting";
  if (division >= 69 && division <= 75) return "consulting";
  if (division >= 58 && division <= 63) return "consulting";
  if (division >= 86 && division <= 88) return "email";
  if (division >= 49 && division <= 53) return "email";
  return "email";
}

export const SYSTEMKLAR_YEARLY_KR = 499 * 12;

export type CalculationInput = {
  itUsers: ItUsersBucket;
  hourlyWage: number;
  industrycode: number;
  industryLabel: string;
  primaryItUse: PrimaryItUse;
  problems: ItProblemsLevel;
};

export type CalculationResult = {
  tabPerYear: number;
  hourlyWage: number;
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
  const naceDependency = getItDependency(input.industrycode);
  const useDependency = PRIMARY_IT_DEPENDENCY[input.primaryItUse];
  const itDependency = Math.min(Math.max(naceDependency, useDependency), 1);
  const employees = employeeCountFromItUsers(input.itUsers);
  const downtimeHours = DOWNTIME_HOURS[input.problems];
  const tabPerYear = Math.round(employees * input.hourlyWage * itDependency * downtimeHours);
  const savings = Math.max(0, tabPerYear - SYSTEMKLAR_YEARLY_KR);

  return {
    tabPerYear,
    hourlyWage: input.hourlyWage,
    employees,
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
