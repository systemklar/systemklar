import type { SupabaseClient } from "@supabase/supabase-js";
import {
  companyNameFromProfilesEmbed,
  REPORTS_ADMIN_SELECT_WITH_PROFILE,
  REPORTS_TABLE_COLUMNS,
} from "@/lib/reports-queries";
import { logSupabaseError } from "@/lib/supabase-error";

export type ReportDetailRow = {
  id: string;
  user_id: string;
  title: string;
  period: string;
  status_summary: string;
  incidents: string;
  resolved: string;
  recommendations: string;
  created_at: string;
};

function mapReportRow(raw: Record<string, unknown>): ReportDetailRow {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    title: String(raw.title),
    period: String(raw.period),
    status_summary: String(raw.status_summary ?? ""),
    incidents: String(raw.incidents ?? ""),
    resolved: String(raw.resolved ?? ""),
    recommendations: String(raw.recommendations ?? ""),
    created_at: String(raw.created_at),
  };
}

async function companyNameForUserId(client: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await client
    .from("profiles")
    .select("company_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("[report-detail] profiles company_name", error);
    return null;
  }
  const name = data?.company_name;
  const s = typeof name === "string" ? name.trim() : "";
  return s || null;
}

/** Admin: én rapport efter id (RLS admin select). */
export async function fetchAdminReportDetail(
  client: SupabaseClient,
  id: string,
): Promise<{ report: ReportDetailRow; company_name: string | null } | null> {
  if (!id) return null;

  const embedded = await client.from("reports").select(REPORTS_ADMIN_SELECT_WITH_PROFILE).eq("id", id).maybeSingle();

  if (!embedded.error && embedded.data) {
    const raw = embedded.data as Record<string, unknown>;
    const embedName = companyNameFromProfilesEmbed(raw.profiles);
    const report = mapReportRow(raw);
    const company_name = embedName ?? (await companyNameForUserId(client, report.user_id));
    return { report, company_name };
  }

  if (embedded.error) {
    logSupabaseError("[admin/reports/[id]] fetch (profiles join)", embedded.error);
  }

  const plain = await client.from("reports").select(REPORTS_TABLE_COLUMNS).eq("id", id).maybeSingle();
  if (plain.error || !plain.data) {
    if (plain.error) logSupabaseError("[admin/reports/[id]] fetch", plain.error);
    return null;
  }

  const report = mapReportRow(plain.data as Record<string, unknown>);
  const company_name = await companyNameForUserId(client, report.user_id);
  return { report, company_name };
}

/** Portal: rapport for den angivne bruger. */
export async function fetchPortalReportDetail(
  client: SupabaseClient,
  id: string,
  userId: string,
): Promise<{ report: ReportDetailRow; company_name: string | null } | null> {
  if (!id) return null;

  const embedded = await client
    .from("reports")
    .select(REPORTS_ADMIN_SELECT_WITH_PROFILE)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!embedded.error && embedded.data) {
    const raw = embedded.data as Record<string, unknown>;
    const embedName = companyNameFromProfilesEmbed(raw.profiles);
    const report = mapReportRow(raw);
    const company_name = embedName ?? (await companyNameForUserId(client, report.user_id));
    return { report, company_name };
  }

  if (embedded.error) {
    logSupabaseError("[portal/rapport/[id]] fetch (profiles join)", embedded.error);
  }

  const plain = await client
    .from("reports")
    .select(REPORTS_TABLE_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (plain.error || !plain.data) {
    if (plain.error) logSupabaseError("[portal/rapport/[id]] fetch", plain.error);
    return null;
  }

  const report = mapReportRow(plain.data as Record<string, unknown>);
  const company_name = await companyNameForUserId(client, report.user_id);
  return { report, company_name };
}
