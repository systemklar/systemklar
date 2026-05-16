import type { SupabaseClient } from "@supabase/supabase-js";
import { UNKNOWN_COMPANY_LABEL } from "@/lib/profile-customer";
import { normalizeTicketPriority, type TicketPriority } from "@/lib/ticket-display";

/** PostgREST-embed når FK tickets.organisation_id → organisations/profiles findes. */
export const TICKET_SELECT_WITH_PROFILE =
  "id,ticket_number,title,description,status,priority,organisation_id,created_at,updated_at,profiles(company_name,email)";
export const TICKET_SELECT_BASE =
  "id,ticket_number,title,description,status,priority,organisation_id,created_at,updated_at";

export type ProfileEmbed = {
  company_name: string;
  email: string | null;
} | null;

export type TicketWithProfileRow = {
  id: string;
  ticket_number: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: TicketPriority;
  organisation_id: string;
  created_at: string;
  updated_at: string | null;
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

function parseTicketNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function companyFromTicketRow(row: TicketWithProfileRow): string {
  const name = row.profiles?.company_name?.trim();
  return name || UNKNOWN_COMPANY_LABEL;
}

export function normalizeTicketWithProfile(raw: Record<string, unknown>): TicketWithProfileRow | null {
  const id = raw.id;
  const title = raw.title;
  const organisation_id = raw.organisation_id;
  const created_at = raw.created_at;
  const status = raw.status;
  if (typeof id !== "string" || typeof title !== "string" || typeof organisation_id !== "string") {
    return null;
  }
  const description =
    typeof raw.description === "string" ? raw.description : raw.description == null ? null : null;
  const updated_at =
    typeof raw.updated_at === "string" ? raw.updated_at : raw.updated_at == null ? null : null;

  return {
    id,
    ticket_number: parseTicketNumber(raw.ticket_number),
    title,
    description,
    status: typeof status === "string" ? status : "active",
    priority: normalizeTicketPriority(typeof raw.priority === "string" ? raw.priority : null),
    organisation_id,
    created_at: typeof created_at === "string" ? created_at : "",
    updated_at,
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

/** Portal: ticket skal tilhøre den angivne organisation. */
export async function fetchTicketWithProfileForUser(
  client: SupabaseClient,
  ticketId: string,
  organisationId: string,
): Promise<TicketWithProfileRow | null> {
  const { data, error } = await client
    .from("tickets")
    .select(TICKET_SELECT_BASE)
    .eq("id", ticketId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return normalizeTicketWithProfile(data as Record<string, unknown>);
}
