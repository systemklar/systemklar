"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { TicketAttachment } from "@/lib/ticket-attachments";
import { createClient } from "@/lib/supabase";

const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPT_EXT = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
]);

const ACCEPT_ATTR = ".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.txt";

export type FileUploadProps = {
  ticketId: string;
  organisationId: string;
  /** Når udeladt eller null, gemmes vedhæftning uden besked (fx før besked sendes eller kun til sagen). */
  messageId?: string | null;
  onUploadComplete: (attachment: TicketAttachment) => void;
  disabled?: boolean;
};

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function FileUpload({
  ticketId,
  organisationId,
  messageId = null,
  onUploadComplete,
  disabled,
}: FileUploadProps) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled || busy) return;

    const ext = extOf(file.name);
    if (!ACCEPT_EXT.has(ext)) {
      setError("Filtype ikke tilladt.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Filen må højst være 10 MB.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setError("Du er ikke logget ind.");
      return;
    }

    setBusy(true);
    setError(null);

    const path = `${organisationId}/${ticketId}/${Date.now()}_${file.name}`;

    try {
      const { data: up, error: upErr } = await supabase.storage.from("attachments").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr || !up?.path) {
        setError(upErr?.message ?? "Upload fejlede.");
        setBusy(false);
        return;
      }

      const row = {
        ticket_id: ticketId,
        organisation_id: organisationId,
        uploaded_by: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || null,
        storage_path: up.path,
        message_id: messageId,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("attachments")
        .insert(row)
        .select(
          "id, ticket_id, message_id, organisation_id, uploaded_by, file_name, file_size, file_type, storage_path, created_at",
        )
        .single();

      if (insErr || !inserted) {
        await supabase.storage.from("attachments").remove([up.path]);
        setError(insErr?.message ?? "Kunne ikke gemme vedhæftning.");
        setBusy(false);
        return;
      }

      onUploadComplete(inserted as TicketAttachment);
    } catch (e) {
      console.error("[FileUpload]", e);
      setError("Upload fejlede.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => void handleChange(e)}
        disabled={disabled || busy}
      />
      <button
        type="button"
        onClick={pickFile}
        disabled={disabled || busy}
        className="inline-flex items-center gap-1.5 text-sm text-[#4A8CB5] transition hover:text-[#0A6EBD] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : <Paperclip className="h-4 w-4 shrink-0" aria-hidden />}
        Vedhæft fil
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
