import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeTicketAttachmentRow,
  sanitizeFileName,
  type TicketAttachment,
} from "@/lib/ticket-attachments";

export const TICKET_ATTACHMENTS_BUCKET = "ticket-attachments";

const ATTACHMENT_SELECT =
  "id, ticket_id, message_id, organisation_id, uploaded_by, file_name, file_size, file_type, storage_path, created_at";

export async function uploadTicketAttachment(
  client: SupabaseClient,
  params: {
    file: File;
    organisationId: string;
    ticketId: string;
    uploadedBy: string;
  },
): Promise<{ attachment: TicketAttachment | null; error: string | null }> {
  const path = `${params.organisationId}/${params.ticketId}/${Date.now()}_${sanitizeFileName(params.file.name)}`;

  const { data: uploaded, error: uploadError } = await client.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .upload(path, params.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError || !uploaded?.path) {
    return { attachment: null, error: uploadError?.message ?? "Upload fejlede." };
  }

  client.storage.from(TICKET_ATTACHMENTS_BUCKET).getPublicUrl(uploaded.path);

  const { data: inserted, error: insertError } = await client
    .from("attachments")
    .insert({
      ticket_id: params.ticketId,
      organisation_id: params.organisationId,
      uploaded_by: params.uploadedBy,
      file_name: params.file.name,
      file_size: params.file.size,
      file_type: params.file.type || null,
      storage_path: uploaded.path,
      message_id: null,
    })
    .select(ATTACHMENT_SELECT)
    .single();

  if (insertError || !inserted) {
    await client.storage.from(TICKET_ATTACHMENTS_BUCKET).remove([uploaded.path]);
    return { attachment: null, error: insertError?.message ?? "Kunne ikke gemme vedhæftning." };
  }

  const attachment = normalizeTicketAttachmentRow(inserted as Record<string, unknown>);
  return { attachment, error: null };
}
