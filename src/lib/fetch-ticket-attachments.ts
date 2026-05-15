import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTicketAttachmentRow, type TicketAttachment } from "@/lib/ticket-attachments";
import { TICKET_ATTACHMENTS_BUCKET } from "@/lib/upload-ticket-attachment";

/** Primær DB-tabel; `ticket_attachments` forsøges som alias hvis den findes. */
export const TICKET_ATTACHMENTS_TABLE = "attachments";

export const TICKET_ATTACHMENTS_SELECT =
  "id, ticket_id, message_id, organisation_id, uploaded_by, file_name, file_size, file_type, storage_path, created_at";

const TABLE_CANDIDATES = ["attachments", "ticket_attachments"] as const;

export function normalizeAttachmentRows(data: unknown[]): TicketAttachment[] {
  return data
    .map((r) => normalizeTicketAttachmentRow(r as Record<string, unknown>))
    .filter((a): a is TicketAttachment => a !== null);
}

export async function fetchTicketAttachments(
  client: SupabaseClient,
  ticketId: string,
): Promise<TicketAttachment[]> {
  if (!ticketId) {
    console.warn("[fetchTicketAttachments] mangler ticketId");
    return [];
  }

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await client
      .from(table)
      .select(TICKET_ATTACHMENTS_SELECT)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      const missingTable =
        error.code === "42P01" ||
        error.message?.toLowerCase().includes("does not exist");
      console.warn("[fetchTicketAttachments] query fejlede", {
        table,
        ticketId,
        bucket: TICKET_ATTACHMENTS_BUCKET,
        code: error.code,
        message: error.message,
        missingTable,
      });
      if (missingTable) continue;
      return [];
    }

    const rows = normalizeAttachmentRows(data ?? []);
    console.info("[fetchTicketAttachments] resultat", {
      table,
      ticketId,
      rawCount: data?.length ?? 0,
      normalizedCount: rows.length,
      rows,
    });
    return rows;
  }

  console.warn("[fetchTicketAttachments] ingen tabel matchede", { ticketId });
  return [];
}
