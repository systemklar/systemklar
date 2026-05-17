"use client";

import { File, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { TicketAttachment } from "@/lib/ticket-attachments";
import { formatFileSize } from "@/lib/ticket-attachments";
import { TICKET_ATTACHMENTS_BUCKET } from "@/lib/upload-ticket-attachment";
import { createClient } from "@/lib/supabase";

export type AttachmentListProps = {
  attachments: TicketAttachment[];
  storageBucket?: string;
  showDelete?: boolean;
  /** Filtrér hvem der må slette; hvis udeladt vises slet for alle ved showDelete. */
  canDelete?: (a: TicketAttachment) => boolean;
  onDelete?: (id: string) => void;
};

function fileKind(fileName: string, mime: string | null): "pdf" | "image" | "office" | "other" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (/\.(png|jpe?g|gif|webp)$/i.test(lower) || (mime?.startsWith("image/") ?? false)) return "image";
  if (/\.(docx?|xlsx?)$/i.test(lower)) return "office";
  return "other";
}

export function AttachmentList({
  attachments,
  storageBucket = "attachments",
  showDelete,
  canDelete,
  onDelete,
}: AttachmentListProps) {
  const supabase = useMemo(() => createClient(), []);
  const isPublicBucket = storageBucket === TICKET_ATTACHMENTS_BUCKET;
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const download = async (a: TicketAttachment) => {
    setError(null);
    setDownloadingId(a.id);
    let url: string | null = null;
    if (isPublicBucket) {
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(a.storage_path);
      url = data.publicUrl;
    } else {
      const { data, error: signErr } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(a.storage_path, 3600);
      if (signErr || !data?.signedUrl) {
        setDownloadingId(null);
        setError(signErr?.message ?? "Kunne ikke hente download-link.");
        return;
      }
      url = data.signedUrl;
    }
    setDownloadingId(null);
    if (!url) {
      setError("Kunne ikke hente download-link.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const remove = async (a: TicketAttachment) => {
    if (!showDelete) return;
    if (canDelete && !canDelete(a)) return;
    setError(null);
    setDeletingId(a.id);
    const { error: stErr } = await supabase.storage.from(storageBucket).remove([a.storage_path]);
    if (stErr) {
      console.error("[AttachmentList] storage remove", stErr);
    }
    const { error: delErr } = await supabase.from("attachments").delete().eq("id", a.id);
    setDeletingId(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    onDelete?.(a.id);
  };

  return (
    <div className="flex flex-col">
      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
      <ul className="divide-y divide-[#E4EAF5]">
        {attachments.map((a) => {
          const kind = fileKind(a.file_name, a.file_type);
          const Icon =
            kind === "pdf" ? (
              <FileText className="h-4 w-4 text-red-500" aria-hidden />
            ) : kind === "image" ? (
              <ImageIcon className="h-4 w-4 text-[#2952A3]" aria-hidden />
            ) : kind === "office" ? (
              <FileText className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <File className="h-4 w-4 text-[#9AAAC8]" aria-hidden />
            );

          const busyDl = downloadingId === a.id;
          const busyDel = deletingId === a.id;

          return (
            <li key={a.id} className="flex flex-wrap items-center gap-2 gap-y-2 py-2">
              {Icon}
              <span className="min-w-0 flex-1 truncate text-sm text-[#0A1628]" title={a.file_name}>
                {a.file_name}
              </span>
              <span className="shrink-0 text-xs text-[#2A4868]">{formatFileSize(a.file_size)}</span>
              <button
                type="button"
                disabled={busyDl}
                onClick={() => void download(a)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-[#1E4490] hover:bg-[#E8EEFC] disabled:opacity-50"
              >
                {busyDl ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : "Download"}
              </button>
              {showDelete && (!canDelete || canDelete(a)) ? (
                <button
                  type="button"
                  disabled={busyDel}
                  onClick={() => void remove(a)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {busyDel ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : "Slet"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
