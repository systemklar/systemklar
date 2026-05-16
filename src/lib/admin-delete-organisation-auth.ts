import type { SupabaseClient } from "@supabase/supabase-js";

export type OrganisationProfileForAuthDelete = {
  id: string;
  user_id?: string | null;
  email?: string | null;
};

/** Auth UIDs to attempt — portal profiles use `id`; legacy CRM may use `user_id`. */
export function authUserIdsForProfile(profile: OrganisationProfileForAuthDelete): string[] {
  const ids = new Set<string>();
  const userId = profile.user_id?.trim();
  const profileId = profile.id?.trim();
  if (userId) ids.add(userId);
  if (profileId) ids.add(profileId);
  return [...ids];
}

export type DeleteOrganisationAuthResult = {
  attempted: number;
  deleted: number;
  warnings: string[];
};

/**
 * Deletes Supabase Auth users for all organisation profiles (service role).
 * Tries both profiles.user_id and profiles.id so portal and legacy rows are covered.
 */
export async function deleteAuthUsersForOrganisationProfiles(
  supabaseAdmin: SupabaseClient,
  profiles: OrganisationProfileForAuthDelete[],
): Promise<DeleteOrganisationAuthResult> {
  const authUserIds = new Set<string>();
  for (const profile of profiles) {
    for (const uid of authUserIdsForProfile(profile)) {
      authUserIds.add(uid);
    }
  }

  const warnings: string[] = [];
  let deleted = 0;

  for (const authUid of authUserIds) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUid);
    if (authError) {
      const detail = authError.message || "Ukendt fejl";
      console.error("[admin-delete-organisation-auth] deleteUser failed", { authUid, detail });
      warnings.push(`Auth ${authUid}: ${detail}`);
      continue;
    }
    deleted += 1;
    console.log("[admin-delete-organisation-auth] deleteUser ok", { authUid });
  }

  return { attempted: authUserIds.size, deleted, warnings };
}
