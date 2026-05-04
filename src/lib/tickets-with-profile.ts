import type { SupabaseClient } from "@supabase/supabase-js";
import { UNKNOWN_COMPANY_LABEL } from "@/lib/profile-customer";

/** PostgREST-embed når FK tickets.user_id → profiles.user_id findes (migration 005). */
export const TICKET_SELECT_WITH_PROFILE =
  "id,title,description,status,user_id,created_at,profiles(company_name,email)";

export type ProfileEmbed = {
  company_name: string;
  email: string | null;
} | null;

export type TicketWithProfileRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  user_id: string;
  created_at: string;
  profiles: ProfileEmbed;
};

function normalizeProfileEmbed(raw: unknown): ProfileEmbed {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    const first = raw[0] as { company_name?: string; email?: string | null } | undefined;
    if (!first) return null;
    return {
      company_name: String(first.company_name ?? ""),
      email: first.email != null ? String(first.email) : null,
    };
  }
  const o = raw as { company_name?: string; email?: string | null };
  return {
    company_name: String(o.company_name ?? ""),
    email: o.email != null ? String(o.email) : null,
  };
}

export function companyFromTicketRow(row: TicketWithProfileRow): string {
  const name = row.profiles?.company_name?.trim();
  return name || UNKNOWN_COMPANY_LABEL;
}

export function normalizeTicketWithProfile(raw: Record<string, unknown>): TicketWithProfileRow | null {
  const id = raw.id;
  const title = raw.title;
  const user_id = raw.user_id;
  const created_at = raw.created_at;
  const status = raw.status;
  if (typeof id !== "string" || typeof title !== "string" || typeof user_id !== "string") {
    return null;
  }
  const description =
    typeof raw.description === "string" ? raw.description : raw.description == null ? null : null;

  return {
    id,
    title,
    description,
    status: typeof status === "string" ? status : "active",
    user_id,
    created_at: typeof created_at === "string" ? created_at : "",
    profiles: normalizeProfileEmbed(raw.profiles),
  };
}

/** Hent én ticket med profil-embed (admin detalje). */
export async function fetchTicketWithProfileById(
  client: SupabaseClient,
  ticketId: string,
): Promise<TicketWithProfileRow | null> {
  const { data, error } = await client
    .from("tickets")
    .select(TICKET_SELECT_WITH_PROFILE)
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return normalizeTicketWithProfile(data as Record<string, unknown>);
}

/** Portal: ticket skal tilhøre den angivne bruger. */
export async function fetchTicketWithProfileForUser(
  client: SupabaseClient,
  ticketId: string,
  userId: string,
): Promise<TicketWithProfileRow | null> {
  const { data, error } = await client
    .from("tickets")
    .select(TICKET_SELECT_WITH_PROFILE)
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return normalizeTicketWithProfile(data as Record<string, unknown>);
}
