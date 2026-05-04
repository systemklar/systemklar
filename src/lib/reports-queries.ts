/**
 * Select list for `public.reports` (migration 006_reports.sql).
 * Keep in sync with DB columns: id, user_id, title, period, status_summary, incidents, resolved, recommendations, created_at.
 */
export const REPORTS_TABLE_COLUMNS =
  "id, user_id, title, period, status_summary, incidents, resolved, recommendations, created_at";

/**
 * Same columns + joined `company_name` via FK `reports_user_id_fkey` (PostgREST embed).
 */
export const REPORTS_ADMIN_SELECT_WITH_PROFILE = `${REPORTS_TABLE_COLUMNS}, profiles!reports_user_id_fkey(company_name)`;

/** UI section titles ↔ DB columns on `reports`. */
export const REPORT_DETAIL_SECTIONS: readonly {
  field: "status_summary" | "incidents" | "resolved" | "recommendations";
  title: string;
}[] = [
  { field: "status_summary", title: "Statusoversigt" },
  { field: "incidents", title: "Hændelser i perioden" },
  { field: "resolved", title: "Løste sager" },
  { field: "recommendations", title: "Anbefalinger til næste måned" },
];

export function companyNameFromProfilesEmbed(raw: unknown): string | null {
  if (raw == null || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (!first || typeof first !== "object") return null;
    const name = (first as { company_name?: unknown }).company_name;
    const s = name != null ? String(name).trim() : "";
    return s || null;
  }
  const name = (raw as { company_name?: unknown }).company_name;
  const s = name != null ? String(name).trim() : "";
  return s || null;
}
