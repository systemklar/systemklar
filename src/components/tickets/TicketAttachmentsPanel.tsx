"use client";

import { File, FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTicketAttachments } from "@/lib/fetch-ticket-attachments";
import { formatFileSize, type TicketAttachment } from "@/lib/ticket-attachments";
import {
  TICKET_ATTACHMENTS_BUCKET,
  uploadTicketAttachment,
} from "@/lib/upload-ticket-attachment";
import { createClient } from "@/lib/supabase";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_ACCEPT = "image/*,.pdf,.doc,.docx,.xlsx,.txt";

type TicketAttachmentsPanelProps = {
  ticketId: string;
  organisationId: string;
  /** Vis upload-knap (portal + admin). */
  allowUpload?: boolean;
};

function truncateFileName(name: string, max = 30): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const baseMax = Math.max(8, max - ext.length - 1);
  return `${name.slice(0, baseMax)}…${ext}`;
}

function fileIcon(fileName: string, mime: string | null) {
  const lower = fileName.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(lower) || mime?.startsWith("image/")) {
    return <ImageIcon className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />;
  }
  if (/\.(pdf|docx?|xlsx?|txt)$/i.test(lower)) {
    return <FileText className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
  }
  return <File className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />;
}

export function TicketAttachmentsPanel({
  ticketId,
  organisationId,
  allowUpload = true,
}: TicketAttachmentsPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    if (!ticketId) {
      console.warn("[TicketAttachmentsPanel] mangler ticketId");
      setAttachments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    console.info("[TicketAttachmentsPanel] henter vedhæftninger", {
      ticketId,
      organisationId,
      bucket: TICKET_ATTACHMENTS_BUCKET,
    });
    const rows = await fetchTicketAttachments(supabase, ticketId);
    console.info("[TicketAttachmentsPanel] modtaget", { count: rows.length, rows });
    setAttachments(rows);
    setLoading(false);
  }, [supabase, ticketId, organisationId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  const openAttachment = async (attachment: TicketAttachment) => {
    const { data: publicData } = supabase.storage
      .from(TICKET_ATTACHMENTS_BUCKET)
      .getPublicUrl(attachment.storage_path);
    const { data: signed, error: signErr } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.storage_path, 3600);

    const url = signed?.signedUrl ?? publicData.publicUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    console.error("[TicketAttachmentsPanel] kunne ikke åbne fil", signErr);
    setError(signErr?.message ?? "Kunne ikke åbne filen.");
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError("Filen må højst være 10 MB.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Du er ikke logget ind.");
      return;
    }

    setUploading(true);
    setError(null);

    const { attachment, error: uploadErr } = await uploadTicketAttachment(supabase, {
      file,
      organisationId,
      ticketId,
      uploadedBy: user.id,
    });

    setUploading(false);

    if (uploadErr || !attachment) {
      setError(uploadErr ?? "Kunne ikke uploade filen.");
      return;
    }

    setAttachments((prev) => [...prev, attachment]);
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm text-[#4A8CB5]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Henter vedhæftede filer…
        </p>
      </section>
    );
  }

  if (!ticketId) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[#0D1F2D]">Vedhæftede filer</h2>

      {attachments.length > 0 ? (
        <ul className="mt-3 divide-y divide-sky-50">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-wrap items-center gap-2 gap-y-2 py-2.5 first:pt-0"
            >
              {fileIcon(attachment.file_name, attachment.file_type)}
              <span
                className="min-w-0 flex-1 truncate text-sm text-[#0D1F2D]"
                title={attachment.file_name}
              >
                {truncateFileName(attachment.file_name)}
              </span>
              <span className="shrink-0 text-xs text-[#4A8CB5]">
                {formatFileSize(attachment.file_size)}
              </span>
              <button
                type="button"
                onClick={() => void openAttachment(attachment)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50"
              >
                Åbn
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#4A8CB5]">Ingen vedhæftede filer endnu.</p>
      )}

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {allowUpload ? (
        <div className="mt-4 border-t border-sky-50 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 transition hover:text-sky-700 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden />
            )}
            Tilføj fil
          </button>
        </div>
      ) : null}
    </section>
  );
}
