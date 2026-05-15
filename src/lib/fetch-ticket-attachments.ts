import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTicketAttachmentRow, type TicketAttachment } from "@/lib/ticket-attachments";

/** DB-tabel for ticket-vedhæftninger (bruger `attachments` i Supabase). */
export const TICKET_ATTACHMENTS_TABLE = "attachments";

const ATTACHMENT_SELECT =
  "id, ticket_id, message_id, organisation_id, uploaded_by, file_name, file_size, file_type, storage_path, created_at";

export async function fetchTicketAttachments(
  client: SupabaseClient,
  ticketId: string,
): Promise<TicketAttachment[]> {
  const { data, error } = await client
    .from(TICKET_ATTACHMENTS_TABLE)
    .select(ATTACHMENT_SELECT)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchTicketAttachments]", error);
    return [];
  }

  return (data ?? [])
    .map((r) => normalizeTicketAttachmentRow(r as Record<string, unknown>))
    .filter((a): a is TicketAttachment => a !== null);
}
