import type { SupabaseClient } from "@supabase/supabase-js";

export type CurrentProfile = {
  id: string;
  organisation_id: string;
  role: string;
  full_name: string | null;
  avatar_initials: string | null;
  company_name: string | null;
  email: string | null;
  onboarding_completed: boolean | null;
  onboarding_systems: string[] | null;
};

export async function fetchCurrentProfile(
  client: SupabaseClient,
  userId: string,
): Promise<CurrentProfile | null> {
  if (!userId) return null;

  const profileColumns =
    "id, organisation_id, role, full_name, avatar_initials, company_name, email, onboarding_completed, onboarding_systems";

  const { data: byIdData, error: byIdError } = await client
    .from("profiles")
    .select(profileColumns)
    .eq("id", userId)
    .maybeSingle();

  if (byIdError) {
    console.error("[current-profile] profiles.select by id fejlede", byIdError);
    return null;
  }

  let row = (Array.isArray(byIdData) ? byIdData[0] : byIdData) as CurrentProfile | null | undefined;

  if (!row) {
    const { data: byUserIdData, error: byUserIdError } = await client
      .from("profiles")
      .select(profileColumns)
      .eq("user_id", userId)
      .maybeSingle();

    if (byUserIdError && byUserIdError.code !== "42703") {
      console.error("[current-profile] user_id-fallback fejlede", byUserIdError);
      return null;
    }

    if (byUserIdData) {
      console.warn("[current-profile] fandt profil via user_id-fallback for", userId);
      row = (Array.isArray(byUserIdData) ? byUserIdData[0] : byUserIdData) as CurrentProfile;
    }
  }

  return row ?? null;
}
