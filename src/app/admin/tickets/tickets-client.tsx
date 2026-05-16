"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TicketListRowCompact } from "@/components/tickets/TicketListRow";
import { TicketStatusFilterTabs } from "@/components/tickets/TicketStatusFilterTabs";
import {
  sortTickets,
  ticketMatchesSearch,
  ticketMatchesStatusFilter,
  ticketSearchHaystack,
  type AdminTicketSort,
  type TicketListStatusFilter,
} from "@/lib/ticket-display";
import { fetchLastMessageAtByTicket } from "@/lib/ticket-messages-meta";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { createClient } from "@/lib/supabase";

const adminFieldClass =
  "mt-1.5 w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-[#062840] outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-[#0A6EBD]/20 disabled:cursor-not-allowed disabled:bg-sky-50/50";
const adminLabelClass = "block text-sm font-medium text-[#062840]";

type OrganisationOption = {
  id: string;
  name: string;
};

type AdminTicketsClientProps = {
  initialOrganisationId?: string;
  initialOpenCreate?: boolean;
};

export default function AdminTicketsClient({
  initialOrganisationId,
  initialOpenCreate = false,
}: AdminTicketsClientProps = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [filterOrganisationId, setFilterOrganisationId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const debouncedSearch = useDebouncedValue(query, 300);
  const [lastMessageAtByTicket, setLastMessageAtByTicket] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<AdminTicketSort>("newest");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("normal");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketListStatusFilter>("active");
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(() => new Set());

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    const res = await fetch("/api/admin/tickets", { credentials: "same-origin" });
    const payload = (await res.json().catch(() => ({}))) as {
      tickets?: TicketWithProfileRow[];
      error?: string;
    };

    if (!res.ok || !payload.tickets) {
      console.error("[admin/tickets] fetch", payload.error ?? res.status);
      setTickets([]);
      setUnreadByTicket({});
    } else {
      setTickets(payload.tickets);
      const ids = payload.tickets.map((t) => t.id);
      const [unread, lastMessages] = await Promise.all([
        fetchUnreadMessageCountsByTicket(supabase, ids),
        fetchLastMessageAtByTicket(supabase, ids),
      ]);
      setUnreadByTicket(unread);
      setLastMessageAtByTicket(lastMessages);
    }
    setTicketsLoading(false);
  }, [supabase]);

  const loadOrganisations = useCallback(async () => {
    const res = await fetch("/api/admin/organisations", { credentials: "same-origin" });
    const payload = (await res.json().catch(() => ({}))) as {
      organisations?: OrganisationOption[];
      error?: string;
    };

    if (!res.ok || !payload.organisations) {
      console.error("[admin/tickets] fetch organisations", payload.error ?? res.status);
      setOrganisations([]);
      return;
    }

    setOrganisations(
      payload.organisations
        .map((organisation) => ({
          id: organisation.id,
          name: organisation.name,
        }))
        .filter((organisation) => organisation.id && organisation.name)
        .sort((a, b) => a.name.localeCompare(b.name, "da")),
    );
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTickets();
      void loadOrganisations();
    });
  }, [loadTickets, loadOrganisations]);

  useEffect(() => {
    if (!initialOrganisationId) return;
    setFilterOrganisationId(initialOrganisationId);
    setSelectedOrganisationId(initialOrganisationId);
  }, [initialOrganisationId]);

  useEffect(() => {
    if (!initialOpenCreate) return;
    setModalOpen(true);
    setModalError(null);
    if (initialOrganisationId) {
      setSelectedOrganisationId(initialOrganisationId);
    }
  }, [initialOpenCreate, initialOrganisationId]);

  useEffect(() => {
    if (initialOrganisationId) return;
    setFilterOrganisationId("all");
  }, [statusFilter, initialOrganisationId]);

  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of organisations) m.set(o.id, o.name);
    return m;
  }, [organisations]);

  const viewFilteredTickets = useMemo(() => {
    const q = debouncedSearch.trim();
    const filtered = tickets.filter((t) => {
      if (!ticketMatchesStatusFilter(t.status, statusFilter)) return false;
      if (filterOrganisationId !== "all" && t.organisation_id !== filterOrganisationId) {
        return false;
      }
      if (!q) return true;
      const company = companyFromTicketRow(t);
      const orgName = orgNameById.get(t.organisation_id) ?? company;
      return ticketMatchesSearch(
        ticketSearchHaystack([t.title, company, orgName, String(t.ticket_number ?? "")]),
        q,
        t.ticket_number,
      );
    });
    return sortTickets(filtered, sortBy);
  }, [tickets, statusFilter, debouncedSearch, filterOrganisationId, sortBy, orgNameById]);

  const resetNewTicketForm = () => {
    setSelectedOrganisationId(initialOrganisationId ?? "");
    setNewTicketTitle("");
    setNewTicketDescription("");
    setNewTicketPriority("normal");
  };

  const closeNewTicketModal = () => {
    setModalOpen(false);
    setModalError(null);
    resetNewTicketForm();
  };

  const openNewTicketModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setModalError(null);
    setModalOpen(true);
  };

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingTicket(true);
    setModalError(null);
    setSuccessMessage(null);

    const res = await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        organisation_id: selectedOrganisationId,
        title: newTicketTitle,
        description: newTicketDescription,
        priority: newTicketPriority,
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setCreatingTicket(false);

    if (!res.ok) {
      setModalError(payload.error ?? "Kunne ikke oprette sag.");
      return;
    }

    setModalOpen(false);
    resetNewTicketForm();
    setSuccessMessage("Sagen er oprettet.");
    await loadTickets();
  };

  const markAsResolved = async (ticketId: string) => {
    const previous = tickets;
    setErrorMessage(null);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "resolved" } : t)),
    );
    setResolvingIds((prev) => new Set(prev).add(ticketId));

    const res = await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: "resolved" }),
    });

    setResolvingIds((prev) => {
      const next = new Set(prev);
      next.delete(ticketId);
      return next;
    });

    if (!res.ok) {
      setTickets(previous);
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setErrorMessage(payload.error ?? "Kunne ikke markere sagen som løst.");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs text-[#4A8CB5]">Admin</p>
          <h1 className="text-2xl font-bold text-[#062840]">Support & sager</h1>
          <p className="mt-2 text-sm text-[#4A8CB5]">Alle supportssager på tværs af kunder.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <TicketStatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
          <button
            type="button"
            onClick={openNewTicketModal}
            className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0]"
          >
            Ny sag
          </button>
        </div>
      </div>

      {successMessage ? (
        <p className="mt-6 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {ticketsLoading ? (
        <p className="mt-8 text-sm text-slate-500">Henter tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ingen tickets.</p>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Søg</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søg på titel, sagsnr. eller kunde..."
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kunde</span>
                <select
                  value={filterOrganisationId}
                  onChange={(e) => setFilterOrganisationId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm"
                >
                  <option value="all">Alle kunder</option>
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sortering</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as AdminTicketSort)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm"
                >
                  <option value="newest">Nyeste</option>
                  <option value="oldest">Ældste</option>
                  <option value="updated">Senest opdateret</option>
                </select>
              </label>
            </div>
          </div>
          {viewFilteredTickets.length === 0 ? (
            <p className="text-sm text-slate-600">
              {debouncedSearch.trim()
                ? "Ingen sager matcher din søgning."
                : "Ingen sager matcher filteret."}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {viewFilteredTickets.map((t) => {
                const isResolving = resolvingIds.has(t.id);
                const company =
                  orgNameById.get(t.organisation_id) ?? companyFromTicketRow(t);
                return (
                  <TicketListRowCompact
                    key={t.id}
                    ticket={t}
                    href={`/admin/tickets/${t.id}`}
                    lastMessageAt={lastMessageAtByTicket[t.id]}
                    unreadCount={unreadByTicket[t.id] ?? 0}
                    trailing={
                      <>
                        <span className="hidden text-xs text-[#4A8CB5] sm:inline">{company}</span>
                        {statusFilter !== "resolved" && t.status !== "resolved" ? (
                          <button
                            type="button"
                            disabled={isResolving}
                            onClick={(event) => {
                              event.preventDefault();
                              void markAsResolved(t.id);
                            }}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {isResolving ? "Gemmer…" : "Markér som løst"}
                          </button>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeNewTicketModal} titleId="new-ticket-title" panelClassName="max-w-lg">
        <h2 id="new-ticket-title" className="text-lg font-semibold text-[#062840]">
          Ny supportssag
        </h2>
        <p className="mt-1 text-sm text-[#4A8CB5]">
          Opret en sag på vegne af en kunde direkte fra admin-panelet.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void createTicket(event)}>
          <div>
            <label htmlFor="organisation" className={adminLabelClass}>
              Kunde / organisation
            </label>
            <select
              id="organisation"
              required
              value={selectedOrganisationId}
              onChange={(event) => setSelectedOrganisationId(event.target.value)}
              className={adminFieldClass}
            >
              <option value="">Vælg kunde…</option>
              {organisations.map((organisation) => (
                <option key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ticket-title" className={adminLabelClass}>
              Titel
            </label>
            <input
              id="ticket-title"
              type="text"
              required
              value={newTicketTitle}
              onChange={(event) => setNewTicketTitle(event.target.value)}
              placeholder="Kort beskrivelse af problemet"
              className={adminFieldClass}
            />
          </div>

          <div>
            <label htmlFor="ticket-description" className={adminLabelClass}>
              Beskrivelse
            </label>
            <textarea
              id="ticket-description"
              required
              rows={5}
              value={newTicketDescription}
              onChange={(event) => setNewTicketDescription(event.target.value)}
              placeholder="Detaljer kunden eller du har brug for i sagen"
              className={`${adminFieldClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor="ticket-priority" className={adminLabelClass}>
              Prioritet
            </label>
            <select
              id="ticket-priority"
              value={newTicketPriority}
              onChange={(event) => setNewTicketPriority(event.target.value)}
              className={adminFieldClass}
            >
              <option value="lav">Lav</option>
              <option value="normal">Normal</option>
              <option value="høj">Høj</option>
            </select>
          </div>

          {modalError ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">{modalError}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-sky-50 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={closeNewTicketModal}
              disabled={creatingTicket}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-[#4A8CB5] transition hover:bg-sky-50 disabled:opacity-50"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={creatingTicket || !selectedOrganisationId}
              className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingTicket ? "Opretter…" : "Opret sag"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
