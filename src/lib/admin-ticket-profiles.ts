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
export async function resolveDisplayProfilesForOrganisationIds(
  admin: SupabaseClient,
  organisationIds: string[],
): Promise<Map<string, ProfileDisplay>> {
  const out = new Map<string, ProfileDisplay>();
  const unique = [...new Set(organisationIds.filter(Boolean))];
  if (unique.length === 0) return out;

  const { data: byOrg } = await admin
    .from("profiles")
    .select("organisation_id, email, company_name")
    .in("organisation_id", unique)
    .order("created_at", { ascending: true });

  for (const row of byOrg ?? []) {
    const orgId = row.organisation_id as string | null;
    if (orgId && !out.has(orgId)) {
      out.set(orgId, {
        company_name: String((row as { company_name?: string }).company_name ?? ""),
        email:
          (row as { email?: string | null }).email != null
            ? String((row as { email?: string | null }).email)
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
  profileByOrgId: Map<string, ProfileDisplay>,
): TicketWithProfileRow[] {
  const rows: TicketWithProfileRow[] = [];
  for (const t of tickets) {
    const organisationId = typeof t.organisation_id === "string" ? t.organisation_id : "";
    const merged = {
      ...t,
      profiles: toProfileEmbed(profileByOrgId.get(organisationId)),
    };
    const normalized = normalizeTicketWithProfile(merged as Record<string, unknown>);
    if (normalized) rows.push(normalized);
  }
  return rows;
}
