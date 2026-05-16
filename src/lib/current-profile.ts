import type { SupabaseClient } from "@supabase/supabase-js";

/** Normaliserer `profiles.onboarding_systems` fra PostgREST (text[], m.m.). */
export function normalizeOnboardingSystemsFromDb(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const x of raw) {
      if (typeof x !== "string") continue;
      const t = x.trim();
      if (t) out.push(t);
    }
    return out;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        return normalizeOnboardingSystemsFromDb(JSON.parse(t) as unknown);
      } catch {
        return [t];
      }
    }
    return [t];
  }
  return [];
}

export type CurrentProfile = {
  id: string;
  organisation_id: string;
  role: string;
  full_name: string | null;
  avatar_initials: string | null;
  avatar_url: string | null;
  company_name: string | null;
  email: string | null;
  onboarding_completed: boolean | null;
  onboarding_systems: string[] | null;
  onboarding_tour_completed: boolean | null;
};

export async function fetchCurrentProfile(
  client: SupabaseClient,
  userId: string,
): Promise<CurrentProfile | null> {
  if (!userId) return null;

  const profileColumns =
    "id, organisation_id, role, full_name, avatar_initials, avatar_url, company_name, email, onboarding_completed, onboarding_systems, onboarding_tour_completed";

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

  if (!row) return null;

  return {
    ...row,
    onboarding_systems: normalizeOnboardingSystemsFromDb(row.onboarding_systems),
  };
}
