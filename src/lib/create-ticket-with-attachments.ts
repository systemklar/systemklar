import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketAttachment } from "@/lib/ticket-attachments";
import { uploadTicketAttachment } from "@/lib/upload-ticket-attachment";

export async function uploadFilesForTicket(
  supabase: SupabaseClient,
  params: {
    files: File[];
    organisationId: string;
    ticketId: string;
    uploadedBy: string;
  },
): Promise<{ attachments: TicketAttachment[]; error: string | null }> {
  const attachments: TicketAttachment[] = [];

  for (const file of params.files) {
    const { attachment, error } = await uploadTicketAttachment(supabase, {
      file,
      organisationId: params.organisationId,
      ticketId: params.ticketId,
      uploadedBy: params.uploadedBy,
    });
    if (error || !attachment) {
      return { attachments, error: error ?? "Kunne ikke uploade en eller flere filer." };
    }
    attachments.push(attachment);
  }

  return { attachments, error: null };
}
