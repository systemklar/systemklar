import type { SupabaseClient } from "@supabase/supabase-js";

/** Seneste besked pr. ticket (max created_at). */
export async function fetchLastMessageAtByTicket(
  client: SupabaseClient,
  ticketIds: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (ticketIds.length === 0) return out;

  const { data, error } = await client
    .from("messages")
    .select("ticket_id, created_at")
    .in("ticket_id", ticketIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return out;
  }

  for (const row of data as { ticket_id: string; created_at: string }[]) {
    if (!out[row.ticket_id]) {
      out[row.ticket_id] = row.created_at;
    }
  }

  return out;
}
