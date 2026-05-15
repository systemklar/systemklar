"use client";

import Link from "next/link";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { formatDanishDateTime, StatusBadge } from "@/components/tickets/StatusBadge";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { formatFileSize, type TicketAttachment } from "@/lib/ticket-attachments";
import {
  TICKET_ATTACHMENTS_BUCKET,
  uploadTicketAttachment,
} from "@/lib/upload-ticket-attachment";
import {
  normalizeTicketWithProfile,
  TICKET_SELECT_BASE,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export type { TicketWithProfileRow as TicketRow } from "@/lib/tickets-with-profile";

const MAX_PENDING_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_ACCEPT = "image/*,.pdf,.doc,.docx,.xlsx,.txt";

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
        <img
          src={previewUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-sky-100 bg-white px-1">
          <FileText className="h-8 w-8 text-emerald-600" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="ml-auto shrink-0 text-slate-400 transition hover:text-red-500 disabled:opacity-50"
        aria-label={`Fjern ${file.name}`}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function closeCreationState(setters: {
  setShowForm: (v: boolean) => void;
  setPostTicketId: (v: string | null) => void;
  setPendingAttachments: (v: TicketAttachment[]) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setErrorMessage: (v: string | null) => void;
  setPendingFiles: (v: File[]) => void;
}) {
  const {
    setShowForm,
    setPostTicketId,
    setPendingAttachments,
    setTitle,
    setDescription,
    setErrorMessage,
    setPendingFiles,
  } = setters;
  setShowForm(false);
  setPostTicketId(null);
  setPendingAttachments([]);
  setPendingFiles([]);
  setTitle("");
  setDescription("");
  setErrorMessage(null);
}

export default function PortalSupportPage() {
  const supabase = useMemo(() => createClient(), []);
  const portalSession = usePortalSession();
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        const { data: p2 } = await supabase
          .from("profiles")
          .select("organisation_id")
          .eq("user_id", user.id)
          .maybeSingle();
        profile = p2;
      }
      if (profile?.organisation_id) setOrgId(profile.organisation_id);
    })();
  }, [supabase]);

  const organisationId = orgId ?? portalSession?.organisationId ?? null;

  const [showForm, setShowForm] = useState(false);
  const [postTicketId, setPostTicketId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<TicketAttachment[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTickets = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const profile = await fetchCurrentProfile(supabase, user.id);
    if (!profile?.organisation_id) {
      setTickets([]);
      setUnreadByTicket({});
      return;
    }
    setCompanyName(profile.company_name ?? null);

    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_SELECT_BASE)
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[tickets] fetch", error);
      setErrorMessage(error.message);
      setTickets([]);
      setUnreadByTicket({});
      return;
    }

    const rows = (data ?? [])
      .map((r) => normalizeTicketWithProfile(r as unknown as Record<string, unknown>))
      .filter((x): x is TicketWithProfileRow => x !== null)
      .filter((x) => x.organisation_id === profile.organisation_id);
    setTickets(rows);
    setErrorMessage(null);

    const ids = rows.map((t) => t.id);
    const unread = await fetchUnreadMessageCountsByTicket(supabase, ids);
    setUnreadByTicket(unread);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      setListLoading(true);
      await fetchTickets();
      setListLoading(false);
    })();
  }, [fetchTickets]);

  const resetCreation = () => {
    closeCreationState({
      setShowForm,
      setPostTicketId,
      setPendingAttachments,
      setTitle,
      setDescription,
      setErrorMessage,
      setPendingFiles,
    });
  };

  const handlePendingFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    setErrorMessage(null);
    const next = [...pendingFiles];
    let limitError: string | null = null;

    for (const file of picked) {
      if (next.length >= MAX_PENDING_FILES) {
        limitError = "Du kan højst vedhæfte 5 filer.";
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        limitError = "Hver fil må højst være 10 MB.";
        continue;
      }
      next.push(file);
    }

    setPendingFiles(next);
    if (limitError) setErrorMessage(limitError);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setErrorMessage("Du er ikke logget ind.");
      setSubmitting(false);
      return;
    }
    if (!organisationId) {
      setErrorMessage("Organisation ikke fundet.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/tickets", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      ticket?: { id?: unknown };
    };

    if (!res.ok) {
      setErrorMessage(payload.error ?? "Kunne ikke oprette sag.");
      setSubmitting(false);
      return;
    }

    const tid =
      typeof payload.ticket?.id === "string" ? payload.ticket.id : "";

    if (!tid) {
      setErrorMessage("Sag blev oprettet men mangler id – prøv at genindlæse siden.");
      setSubmitting(false);
      return;
    }

    const uploaded: TicketAttachment[] = [];
    if (pendingFiles.length > 0) {
      setUploadingFiles(true);
      for (const file of pendingFiles) {
        const { attachment, error: uploadErr } = await uploadTicketAttachment(supabase, {
          file,
          organisationId,
          ticketId: tid,
          uploadedBy: user.id,
        });
        if (uploadErr || !attachment) {
          setErrorMessage(uploadErr ?? "Kunne ikke uploade en eller flere filer.");
          setUploadingFiles(false);
          setSubmitting(false);
          setPostTicketId(tid);
          await fetchTickets();
          return;
        }
        uploaded.push(attachment);
      }
      setUploadingFiles(false);
      setPendingFiles([]);
    }

    setPostTicketId(tid);
    setPendingAttachments(uploaded);
    await fetchTickets();
    setSubmitting(false);
  };

  const finishCreation = async () => {
    await fetchTickets();
    resetCreation();
  };

  return (
    <PortalLayout activeNav="support">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F2D]">Support & sager</h1>
            <p className="mt-2 text-sm text-[#4A8CB5]">Følg åbne sager og opret nye henvendelser til support.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetCreation();
              } else {
                setShowForm(true);
                setPostTicketId(null);
                setPendingAttachments([]);
                setPendingFiles([]);
                setTitle("");
                setDescription("");
                setErrorMessage(null);
              }
            }}
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Opret ny sag
          </button>
        </div>

        {showForm ? (
          <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0D1F2D]">
              {!postTicketId ? "Ny sag" : "Sag oprettet"}
            </h2>

            {!postTicketId ? (
              <form onSubmit={(e) => void handleCreateTicket(e)} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="ticket-title" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                    Titel
                  </label>
                  <input
                    id="ticket-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                    placeholder="Kort beskrivelse af problemet"
                  />
                </div>
                <div>
                  <label htmlFor="ticket-description" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                    Beskrivelse
                  </label>
                  <textarea
                    id="ticket-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                    placeholder="Uddyb problemet, fejlmeddelelser, hvornår det skete, osv."
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-[#0D1F2D]">Vedhæft filer (valgfrit)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={FILE_ACCEPT}
                    className="hidden"
                    onChange={handlePendingFilesChange}
                    disabled={submitting || uploadingFiles}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting || uploadingFiles || pendingFiles.length >= MAX_PENDING_FILES}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
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
                            disabled={submitting || uploadingFiles}
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
                {errorMessage ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting || uploadingFiles}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {submitting || uploadingFiles ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {uploadingFiles ? "Uploader filer…" : "Sender..."}
                      </span>
                    ) : (
                      "Opret sag"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetCreation()}
                    className="rounded-full border border-sky-200 px-5 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    Annuller
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#4A8CB5]">
                  Din sag er oprettet
                  {pendingAttachments.length > 0
                    ? ` med ${pendingAttachments.length} vedhæftning${pendingAttachments.length === 1 ? "" : "er"}.`
                    : "."}{" "}
                  Tryk &quot;Færdig&quot; for at lukke.
                </p>
                {pendingAttachments.length > 0 ? (
                  <AttachmentList
                    attachments={pendingAttachments}
                    storageBucket={TICKET_ATTACHMENTS_BUCKET}
                    showDelete
                    onDelete={(id) =>
                      setPendingAttachments((prev) => prev.filter((x) => x.id !== id))
                    }
                  />
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void finishCreation()}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                  >
                    Færdig
                  </button>
                  <button
                    type="button"
                    onClick={() => resetCreation()}
                    className="rounded-full border border-sky-200 px-5 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                    >
                    Luk
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#0D1F2D]">Dine sager</h2>
          {errorMessage && !showForm ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {errorMessage}
            </p>
          ) : null}
          {listLoading ? (
            <p className="mt-4 text-sm text-[#4A8CB5]">Henter sager...</p>
          ) : tickets.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F7FF] text-sky-600">
                <span className="text-sm font-bold">0</span>
              </div>
              <p className="mt-4 text-sm text-[#4A8CB5]">
                Du har ingen sager endnu. Klik på &quot;Opret ny sag&quot; for at komme i gang.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Opret ny sag
              </button>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/portal/support/${ticket.id}`}
                    className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[#0D1F2D]">{ticket.title}</p>
                        <TicketUnreadCountBadge count={unreadByTicket[ticket.id] ?? 0} />
                      </div>
                      {companyName ? (
                        <p className="mt-1 text-xs text-[#4A8CB5]">{companyName}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-[#4A8CB5]">
                        {formatDanishDateTime(ticket.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
