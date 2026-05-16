export const ORGANISATION_INDUSTRY_OPTIONS = [
  "Detailhandel",
  "Bygge & anlæg",
  "Transport & logistik",
  "Sundhed",
  "IT & teknologi",
  "Øvrige",
] as const;

export type OrganisationIndustry = (typeof ORGANISATION_INDUSTRY_OPTIONS)[number];

export const ORGANISATION_EMPLOYEE_COUNT_OPTIONS = ["1-5", "6-20", "21-50", "51+"] as const;

export type OrganisationEmployeeCount = (typeof ORGANISATION_EMPLOYEE_COUNT_OPTIONS)[number];
