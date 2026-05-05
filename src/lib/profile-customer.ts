import type { SupabaseClient } from "@supabase/supabase-js";

export const UNKNOWN_COMPANY_LABEL = "Ukendt virksomhed";

export type ProfileCustomerRow = {
  user_id: string | null;
  email: string;
  company_name: string;
};

/**
 * Hent profiler for flere bruger-id'er (kobling tickets.user_id → profiles.user_id).
 */
export async function fetchProfilesByUserIds(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, ProfileCustomerRow>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, ProfileCustomerRow>();
  if (unique.length === 0) return map;

  const { data, error } = await client
    .from("profiles")
    .select("user_id, email, company_name")
    .in("user_id", unique);

  if (error || !data) {
    return map;
  }

  for (const row of data as ProfileCustomerRow[]) {
    if (row.user_id) {
      map.set(row.user_id, row);
    }
  }
  return map;
}

export function companyLabelFromProfile(row: ProfileCustomerRow | undefined): string {
  const name = row?.company_name?.trim();
  return name ? name : UNKNOWN_COMPANY_LABEL;
}

/**
 * Hent firmanavn for én bruger (kundeportal).
 */
export async function fetchCompanyNameForUser(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  if (!userId) return null;
  const { data, error } = await client
    .from("profiles")
    .select("company_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const name = (data as { company_name?: unknown }).company_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}
