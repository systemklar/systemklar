import type { SupabaseClient } from "@supabase/supabase-js";

export function ticketLastViewedStorageKey(ticketId: string): string {
  return `ticket_last_viewed_${ticketId}`;
}

/** ISO-tidsstempel eller null hvis brugeren aldrig har åbnet sagen (ingen ulæste). */
export function getTicketLastViewedIso(ticketId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ticketLastViewedStorageKey(ticketId));
  } catch {
    return null;
  }
}

export function setTicketLastViewedToNow(ticketId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ticketLastViewedStorageKey(ticketId), new Date().toISOString());
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Antal beskeder med created_at efter sidste visning (localStorage).
 * Uden gemt tidspunkt: 0 ulæste.
 */
export async function fetchUnreadMessageCountsByTicket(
  client: SupabaseClient,
  ticketIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const id of ticketIds) {
    counts[id] = 0;
  }
  if (ticketIds.length === 0) return counts;

  const { data, error } = await client.from("messages").select("ticket_id, created_at").in("ticket_id", ticketIds);

  if (error || !data) {
    return counts;
  }

  for (const row of data as { ticket_id: string; created_at: string }[]) {
    const last = getTicketLastViewedIso(row.ticket_id);
    if (!last) continue;
    if (row.created_at > last) {
      counts[row.ticket_id] = (counts[row.ticket_id] ?? 0) + 1;
    }
  }

  return counts;
}
