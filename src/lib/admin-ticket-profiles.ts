import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileEmbed, TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { normalizeTicketWithProfile } from "@/lib/tickets-with-profile";

export type ProfileDisplay = {
  company_name: string;
  email: string | null;
};

/**
 * For hvert ticket.user_id: find profil på profiles.user_id, ellers profil med samme e-mail som auth-brugeren.
 * Bruges med service role så RLS ikke skjuler rækker.
 */
export async function resolveDisplayProfilesForUserIds(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, ProfileDisplay>> {
  const out = new Map<string, ProfileDisplay>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return out;

  const { data: byUid } = await admin
    .from("profiles")
    .select("user_id, email, company_name")
    .in("user_id", unique);

  const missing = new Set(unique);
  for (const row of byUid ?? []) {
    const uid = row.user_id as string | null;
    if (uid) {
      out.set(uid, {
        company_name: String((row as { company_name?: string }).company_name ?? ""),
        email:
          (row as { email?: string | null }).email != null
            ? String((row as { email?: string | null }).email)
            : null,
      });
      missing.delete(uid);
    }
  }

  for (const uid of missing) {
    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(uid);
    if (authErr || !authData.user?.email) continue;
    const email = authData.user.email.trim().toLowerCase();

    const { data: prof } = await admin
      .from("profiles")
      .select("company_name, email")
      .eq("email", email)
      .maybeSingle();

    if (prof) {
      out.set(uid, {
        company_name: String((prof as { company_name?: string }).company_name ?? ""),
        email:
          (prof as { email?: string | null }).email != null
            ? String((prof as { email?: string | null }).email)
            : null,
      });
    }
  }

  return out;
}

function toProfileEmbed(p: ProfileDisplay | undefined): ProfileEmbed {
  if (!p) return null;
  return {
    company_name: p.company_name,
    email: p.email,
  };
}

export function mergeTicketRowsWithProfiles(
  tickets: Record<string, unknown>[],
  profileByUserId: Map<string, ProfileDisplay>,
): TicketWithProfileRow[] {
  const rows: TicketWithProfileRow[] = [];
  for (const t of tickets) {
    const userId = typeof t.user_id === "string" ? t.user_id : "";
    const merged = {
      ...t,
      profiles: toProfileEmbed(profileByUserId.get(userId)),
    };
    const normalized = normalizeTicketWithProfile(merged as Record<string, unknown>);
    if (normalized) rows.push(normalized);
  }
  return rows;
}
