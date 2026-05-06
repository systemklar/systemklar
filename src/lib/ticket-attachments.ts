/** Række fra public.attachments (ticket-vedhæftninger). */
export type TicketAttachment = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  organisation_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string;
  created_at: string;
};

export function normalizeTicketAttachmentRow(raw: Record<string, unknown>): TicketAttachment | null {
  const id = raw.id;
  const ticket_id = raw.ticket_id;
  const organisation_id = raw.organisation_id;
  const uploaded_by = raw.uploaded_by;
  const file_name = raw.file_name;
  const storage_path = raw.storage_path;
  const created_at = raw.created_at;
  if (
    typeof id !== "string" ||
    typeof ticket_id !== "string" ||
    typeof organisation_id !== "string" ||
    typeof uploaded_by !== "string" ||
    typeof file_name !== "string" ||
    typeof storage_path !== "string"
  ) {
    return null;
  }
  const message_id = typeof raw.message_id === "string" ? raw.message_id : null;
  let file_size: number | null = null;
  if (typeof raw.file_size === "number" && Number.isFinite(raw.file_size)) {
    file_size = raw.file_size;
  } else if (typeof raw.file_size === "string" && raw.file_size.trim() !== "") {
    const n = Number(raw.file_size);
    file_size = Number.isFinite(n) ? n : null;
  }
  const file_type = typeof raw.file_type === "string" ? raw.file_type : null;
  const created = typeof created_at === "string" ? created_at : new Date().toISOString();

  return {
    id,
    ticket_id,
    message_id,
    organisation_id,
    uploaded_by,
    file_name,
    file_size,
    file_type,
    storage_path,
    created_at: created,
  };
}

const UNITS = ["B", "KB", "MB", "GB"];

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < UNITS.length - 1) {
    n /= 1024;
    u += 1;
  }
  const rounded = u === 0 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded} ${UNITS[u]}`;
}
