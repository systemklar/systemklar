"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import {
  formatDanishDateTime,
  normalizeTicketStatus,
  StatusBadge,
} from "@/components/tickets/StatusBadge";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

type OrganisationOption = {
  id: string;
  name: string;
};

type TicketView = "active" | "resolved";

export default function AdminTicketsClient() {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [organisations, setOrganisations] = useState<OrganisationOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("normal");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketView, setTicketView] = useState<TicketView>("active");

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
      const unread = await fetchUnreadMessageCountsByTicket(
        supabase,
        payload.tickets.map((t) => t.id),
      );
      setUnreadByTicket(unread);
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
    setSelectedCompany("all");
  }, [ticketView]);

  const viewFilteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      const status = normalizeTicketStatus(t.status);
      return ticketView === "resolved" ? status === "resolved" : status !== "resolved";
    });
    if (ticketView === "resolved") {
      return [...filtered].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return filtered;
  }, [tickets, ticketView]);

  const resetNewTicketForm = () => {
    setSelectedOrganisationId("");
    setNewTicketTitle("");
    setNewTicketDescription("");
    setNewTicketPriority("normal");
  };

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingTicket(true);
    setErrorMessage(null);
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
      setErrorMessage(payload.error ?? "Kunne ikke oprette sag.");
      return;
    }

    resetNewTicketForm();
    setModalOpen(false);
    setSuccessMessage("Sagen er oprettet.");
    await loadTickets();
  };

  const groupedByCompany = useMemo(() => {
    const map = new Map<string, TicketWithProfileRow[]>();
    for (const t of viewFilteredTickets) {
      const company = companyFromTicketRow(t);
      if (!map.has(company)) {
        map.set(company, []);
      }
      map.get(company)!.push(t);
    }
    return Array.from(map.entries())
      .map(([company, rows]) => ({
        company,
        tickets: rows,
        ticketCount: rows.length,
      }))
      .sort((a, b) => a.company.localeCompare(b.company, "da"));
  }, [viewFilteredTickets]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedByCompany
      .filter((g) => selectedCompany === "all" || g.company === selectedCompany)
      .map((g) => ({
        ...g,
        tickets: g.tickets.filter((t) => {
          if (!q) return true;
          const title = t.title.toLowerCase();
          const company = g.company.toLowerCase();
          return title.includes(q) || company.includes(q);
        }),
      }))
      .filter((g) => g.tickets.length > 0);
  }, [groupedByCompany, selectedCompany, query]);

  const totalFiltered = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.tickets.length, 0),
    [filteredGroups],
  );

  const countLabel = ticketView === "resolved" ? "løste" : "aktive";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Support & sager</h1>
          <p className="mt-2 text-sm text-slate-600">Tickets grupperet per kunde.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div
            className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5"
            role="tablist"
            aria-label="Vis aktive eller løste sager"
          >
            <button
              type="button"
              role="tab"
              aria-selected={ticketView === "active"}
              onClick={() => setTicketView("active")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                ticketView === "active"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Aktive
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ticketView === "resolved"}
              onClick={() => setTicketView("resolved")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                ticketView === "resolved"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Løste
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setModalOpen(true);
            }}
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
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
      ) : viewFilteredTickets.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">
          Ingen {ticketView === "resolved" ? "løste" : "aktive"} sager.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Kunder</p>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCompany("all")}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${
                  selectedCompany === "all" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span>Alle sager</span>
                <span className="text-xs font-semibold">
                  {viewFilteredTickets.length} {countLabel}
                </span>
              </button>
              {groupedByCompany.map((group) => (
                <button
                  key={group.company}
                  type="button"
                  onClick={() => setSelectedCompany(group.company)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${
                    selectedCompany === group.company ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{group.company}</span>
                  <span className="ml-2 shrink-0 text-xs font-semibold">
                    {group.ticketCount} {countLabel}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Søg</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer på kundenavn eller sagsnavn..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:text-sm"
              />
            </div>

            {totalFiltered === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                Ingen {ticketView === "resolved" ? "løste" : "aktive"} sager matcher filteret.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.company} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <p className="font-semibold text-slate-900">{group.company}</p>
                      <p className="text-xs text-slate-500">{group.tickets.length} sager</p>
                    </div>
                    <ul className="divide-y divide-slate-200">
                      {group.tickets.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/admin/tickets/${t.id}`}
                            className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-slate-900">{t.title}</p>
                                <TicketUnreadCountBadge count={unreadByTicket[t.id] ?? 0} />
                              </div>
                              <p className="mt-0.5 text-sm text-slate-500">{formatDanishDateTime(t.created_at)}</p>
                            </div>
                            <StatusBadge status={t.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
          onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Ny supportssag</h2>
              <p className="mt-1 text-sm text-slate-500">
                Opret en sag på vegne af en kunde direkte fra admin-panelet.
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void createTicket(event)}>
              <div>
                <label htmlFor="organisation" className="mb-1 block text-sm font-medium text-slate-700">
                  Kunde/organisation
                </label>
                <select
                  id="organisation"
                  required
                  value={selectedOrganisationId}
                  onChange={(event) => setSelectedOrganisationId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-sm"
                >
                  <option value="">Vælg kunde...</option>
                  {organisations.map((organisation) => (
                    <option key={organisation.id} value={organisation.id}>
                      {organisation.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ticket-title" className="mb-1 block text-sm font-medium text-slate-700">
                  Titel på sagen
                </label>
                <input
                  id="ticket-title"
                  type="text"
                  required
                  value={newTicketTitle}
                  onChange={(event) => setNewTicketTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-sm"
                />
              </div>

              <div>
                <label htmlFor="ticket-description" className="mb-1 block text-sm font-medium text-slate-700">
                  Beskrivelse
                </label>
                <textarea
                  id="ticket-description"
                  required
                  rows={5}
                  value={newTicketDescription}
                  onChange={(event) => setNewTicketDescription(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-sm"
                />
              </div>

              <div>
                <label htmlFor="ticket-priority" className="mb-1 block text-sm font-medium text-slate-700">
                  Prioritet
                </label>
                <select
                  id="ticket-priority"
                  value={newTicketPriority}
                  onChange={(event) => setNewTicketPriority(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-sm"
                >
                  <option value="lav">Lav</option>
                  <option value="normal">Normal</option>
                  <option value="høj">Høj</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  {creatingTicket ? "Opretter..." : "Opret sag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
