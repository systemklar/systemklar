import type { SupabaseClient } from "@supabase/supabase-js";

export type CurrentProfile = {
  id: string;
  organisation_id: string;
  role: string;
  full_name: string | null;
  avatar_initials: string | null;
  company_name: string | null;
  email: string | null;
};

export async function fetchCurrentProfile(
  client: SupabaseClient,
  userId: string,
): Promise<CurrentProfile | null> {
  if (!userId) return null;
  const { data, error } = await client
    .from("profiles")
    .select("id, organisation_id, role, full_name, avatar_initials, company_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CurrentProfile;
}
