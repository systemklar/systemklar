"use client";

import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { formatFileSize } from "@/lib/ticket-attachments";

export const TICKET_FORM_FILE_ACCEPT = "image/*,.pdf,.doc,.docx,.xlsx,.txt";
export const TICKET_FORM_MAX_FILES = 5;
export const TICKET_FORM_MAX_FILE_BYTES = 10 * 1024 * 1024;

const fieldClass =
  "w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-base text-[#0D1F2D] outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-[#0A6EBD]/20 md:text-sm";
const labelClass = "mb-1 block text-sm font-medium text-[#0D1F2D]";

export type TicketFormOrganisationOption = {
  id: string;
  name: string;
};

export type TicketFormSubmitValues = {
  title: string;
  description: string;
  organisationId?: string;
  files: File[];
};

export type TicketFormProps = {
  organisations?: TicketFormOrganisationOption[];
  organisationId?: string;
  onOrganisationChange?: (id: string) => void;
  initialTitle?: string;
  onSubmit: (values: TicketFormSubmitValues) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  uploadingFiles?: boolean;
  error?: string | null;
  showCancel?: boolean;
  submitLabel?: string;
  idPrefix?: string;
};

function PendingFilePreviewItem({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const isImage = file.type.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 p-2">
      {isImage && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-sky-100 bg-white px-1">
          <FileText className="h-8 w-8 text-emerald-600" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#2C4A5E]" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-[#4A8CB5]">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="ml-auto shrink-0 text-[#94a3b8] transition hover:text-red-500 disabled:opacity-50"
        aria-label={`Fjern ${file.name}`}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function TicketForm({
  organisations,
  organisationId = "",
  onOrganisationChange,
  initialTitle = "",
  onSubmit,
  onCancel,
  submitting = false,
  uploadingFiles = false,
  error = null,
  showCancel = true,
  submitLabel = "Opret sag",
  idPrefix: idPrefixProp,
}: TicketFormProps) {
  const autoId = useId();
  const idPrefix = idPrefixProp ?? `ticket-form-${autoId.replace(/:/g, "")}`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const showOrganisationSelect = organisations && organisations.length > 0;
  const busy = submitting || uploadingFiles;
  const displayError = error ?? localError;

  const handlePendingFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    setLocalError(null);
    const next = [...pendingFiles];
    let limitError: string | null = null;

    for (const file of picked) {
      if (next.length >= TICKET_FORM_MAX_FILES) {
        limitError = "Du kan højst vedhæfte 5 filer.";
        break;
      }
      if (file.size > TICKET_FORM_MAX_FILE_BYTES) {
        limitError = "Hver fil må højst være 10 MB.";
        continue;
      }
      next.push(file);
    }

    setPendingFiles(next);
    if (limitError) setLocalError(limitError);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setLocalError("Titel er påkrævet.");
      return;
    }
    if (showOrganisationSelect && !organisationId.trim()) {
      setLocalError("Vælg en kunde.");
      return;
    }

    await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      organisationId: showOrganisationSelect ? organisationId : undefined,
      files: pendingFiles,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {showOrganisationSelect ? (
        <div>
          <label htmlFor={`${idPrefix}-organisation`} className={labelClass}>
            Vælg kunde
          </label>
          <select
            id={`${idPrefix}-organisation`}
            required
            value={organisationId}
            onChange={(e) => onOrganisationChange?.(e.target.value)}
            disabled={busy}
            className={fieldClass}
          >
            <option value="">Vælg kunde…</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          Titel
        </label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={busy}
          className={fieldClass}
          placeholder="Kort beskrivelse af problemet"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Beskrivelse
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          disabled={busy}
          className={fieldClass}
          placeholder="Uddyb problemet, fejlmeddelelser, hvornår det skete, osv."
        />
      </div>

      <div>
        <p className={labelClass}>Vedhæft filer (valgfrit)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={TICKET_FORM_FILE_ACCEPT}
          className="hidden"
          onChange={handlePendingFilesChange}
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || pendingFiles.length >= TICKET_FORM_MAX_FILES}
          className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 px-4 py-2 text-sm font-medium text-[#0A6EBD] transition hover:bg-sky-50 disabled:opacity-50"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          Vedhæft filer
        </button>
        {pendingFiles.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`}>
                <PendingFilePreviewItem
                  file={file}
                  onRemove={() => removePendingFile(index)}
                  disabled={busy}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {uploadingFiles ? (
        <p className="flex items-center gap-2 text-sm text-[#4A8CB5]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Uploader filer…
        </p>
      ) : null}

      {displayError ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">{displayError}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={busy || (showOrganisationSelect && !organisationId)}
          className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {uploadingFiles ? "Uploader filer…" : "Opretter…"}
            </span>
          ) : (
            submitLabel
          )}
        </button>
        {showCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-sky-200 px-5 py-2.5 text-sm font-semibold text-[#0A6EBD] transition hover:bg-sky-50 disabled:opacity-50"
          >
            Annuller
          </button>
        ) : null}
      </div>
    </form>
  );
}
