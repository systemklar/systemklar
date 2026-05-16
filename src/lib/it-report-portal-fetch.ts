import type { SupabaseClient } from "@supabase/supabase-js";
import { IT_REPORTS_TABLE_COLUMNS } from "@/lib/it-reports";
import { logSupabaseError } from "@/lib/supabase-error";

export type PortalItReportRow = {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  content: unknown;
  ai_summary: string | null;
  ai_recommendations: string | null;
};

export async function fetchPortalItReportDetail(
  client: SupabaseClient,
  id: string,
  userId: string,
): Promise<PortalItReportRow | null> {
  if (!id) return null;

  const { data: profile, error: pErr } = await client
    .from("profiles")
    .select("organisation_id")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (pErr) {
    logSupabaseError("[portal/rapport/[id]] profile", pErr);
    return null;
  }

  const orgId = profile?.organisation_id as string | null | undefined;
  if (!orgId) return null;

  const { data, error } = await client
    .from("it_reports")
    .select(IT_REPORTS_TABLE_COLUMNS)
    .eq("id", id)
    .eq("organisation_id", orgId)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    logSupabaseError("[portal/rapport/[id]] it_reports", error);
    return null;
  }
  if (!data) return null;

  const raw = data as Record<string, unknown>;
  return {
    id: String(raw.id),
    title: String(raw.title),
    period_start: String(raw.period_start),
    period_end: String(raw.period_end),
    content: raw.content,
    ai_summary: (raw.ai_summary as string | null) ?? null,
    ai_recommendations: (raw.ai_recommendations as string | null) ?? null,
  };
}
