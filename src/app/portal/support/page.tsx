"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { FileUpload } from "@/components/ui/FileUpload";
import { formatDanishDateTime, StatusBadge } from "@/components/tickets/StatusBadge";
import { fetchCurrentProfile } from "@/lib/current-profile";
import type { TicketAttachment } from "@/lib/ticket-attachments";
import {
  normalizeTicketWithProfile,
  TICKET_SELECT_BASE,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export type { TicketWithProfileRow as TicketRow } from "@/lib/tickets-with-profile";

function closeCreationState(setters: {
  setShowForm: (v: boolean) => void;
  setPostTicketId: (v: string | null) => void;
  setPendingAttachments: (v: TicketAttachment[]) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setErrorMessage: (v: string | null) => void;
}) {
  const { setShowForm, setPostTicketId, setPendingAttachments, setTitle, setDescription, setErrorMessage } =
    setters;
  setShowForm(false);
  setPostTicketId(null);
  setPendingAttachments([]);
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
    });
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

    setPostTicketId(tid);
    setPendingAttachments([]);
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
                {errorMessage ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {submitting ? "Sender..." : "Opret sag"}
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
                  Din sag er oprettet. Du kan vedhænte filer (valgfrit) – tryk &quot;Færdig&quot; når du er færdig.
                </p>
                <div className="mt-3">
                  <p className="mb-2 text-xs text-[#4A8CB5]">Vedhæft filer (valgfrit)</p>
                  {organisationId ? (
                    <FileUpload
                      ticketId={postTicketId}
                      organisationId={organisationId}
                      onUploadComplete={(a) =>
                        setPendingAttachments((prev) => [...prev, a])
                      }
                    />
                  ) : (
                    <p className="text-sm text-red-600">Organisation ikke fundet.</p>
                  )}
                  <AttachmentList
                    attachments={pendingAttachments}
                    showDelete
                    onDelete={(id) =>
                      setPendingAttachments((prev) => prev.filter((x) => x.id !== id))
                    }
                  />
                </div>
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
