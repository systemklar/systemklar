"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketForm, type TicketFormSubmitValues } from "@/components/tickets/TicketForm";
import { TicketListFilters } from "@/components/tickets/TicketListFilters";
import { TicketListRow } from "@/components/tickets/TicketListRow";
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
import { uploadFilesForTicket } from "@/lib/create-ticket-with-attachments";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { createClient } from "@/lib/supabase";

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
  const router = useRouter();
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
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
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

  const closeNewTicketModal = () => {
    setModalOpen(false);
    setModalError(null);
    setSelectedOrganisationId(initialOrganisationId ?? "");
  };

  const openNewTicketModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setModalError(null);
    setSelectedOrganisationId(initialOrganisationId ?? "");
    setModalOpen(true);
  };

  const handleCreateTicket = async (values: TicketFormSubmitValues) => {
    setCreatingTicket(true);
    setModalError(null);
    setSuccessMessage(null);

    const orgId = values.organisationId ?? selectedOrganisationId;
    const res = await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        organisation_id: orgId,
        title: values.title,
        description: values.description,
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      ticket?: { id?: string };
    };

    if (!res.ok) {
      setModalError(payload.error ?? "Kunne ikke oprette sag.");
      setCreatingTicket(false);
      return;
    }

    const ticketId = typeof payload.ticket?.id === "string" ? payload.ticket.id : "";
    if (!ticketId) {
      setModalError("Sag oprettet men mangler id.");
      setCreatingTicket(false);
      return;
    }

    if (values.files.length > 0) {
      setUploadingFiles(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error: uploadError } = await uploadFilesForTicket(supabase, {
          files: values.files,
          organisationId: orgId,
          ticketId,
          uploadedBy: user.id,
        });
        if (uploadError) {
          setModalError(uploadError);
          setUploadingFiles(false);
          setCreatingTicket(false);
          await loadTickets();
          return;
        }
      }
      setUploadingFiles(false);
    }

    setCreatingTicket(false);
    setModalOpen(false);
    setSuccessMessage("Sagen er oprettet.");
    await loadTickets();
    router.push(`/admin/tickets/${ticketId}`);
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
      <div className="flex flex-col gap-4 border-b border-[#C8D8E4] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs text-[#4A6478]">Admin</p>
          <h1 className="text-2xl font-bold text-[#1E3448]">Support & sager</h1>
          <p className="mt-2 text-sm text-[#4A6478]">Alle supportssager på tværs af kunder.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={openNewTicketModal}
            className="rounded-full bg-[#4A7FA5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3A6F95]"
          >
            Ny sag
          </button>
        </div>
      </div>

      {successMessage ? (
        <p className="mt-6 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[#C8D8E4] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-semibold text-[#1E3448]">Alle sager</h2>
          <TicketStatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
        </div>
        <div className="mt-4">
          <TicketListFilters
            searchQuery={query}
            onSearchChange={setQuery}
            searchPlaceholder="Søg på titel, sagsnr. eller kunde…"
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            showStatusTabs={false}
            organisationId={filterOrganisationId}
            onOrganisationChange={setFilterOrganisationId}
            organisations={organisations}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {ticketsLoading ? (
          <p className="mt-4 text-sm text-[#4A6478]">Henter sager…</p>
        ) : tickets.length === 0 ? (
          <p className="mt-4 text-sm text-[#4A6478]">Ingen sager endnu.</p>
        ) : viewFilteredTickets.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#4A6478]">
            {debouncedSearch.trim()
              ? "Ingen sager matcher din søgning."
              : "Ingen sager matcher filteret."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {viewFilteredTickets.map((t) => {
              const isResolving = resolvingIds.has(t.id);
              const customerName =
                orgNameById.get(t.organisation_id) ?? companyFromTicketRow(t);
              return (
                <TicketListRow
                  key={t.id}
                  ticket={t}
                  href={`/admin/tickets/${t.id}`}
                  lastMessageAt={lastMessageAtByTicket[t.id]}
                  unreadCount={unreadByTicket[t.id] ?? 0}
                  customerName={customerName}
                  trailing={
                    statusFilter !== "resolved" && t.status !== "resolved" ? (
                      <button
                        type="button"
                        disabled={isResolving}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void markAsResolved(t.id);
                        }}
                        className="rounded-full border border-[#C8D8E4] bg-white px-3 py-1 text-xs font-semibold text-[#4A6478] transition hover:border-[#C8D8E4] hover:bg-[#EAF1F7] disabled:opacity-50"
                      >
                        {isResolving ? "Gemmer…" : "Markér som løst"}
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeNewTicketModal} titleId="new-ticket-title" panelClassName="max-w-lg">
        <h2 id="new-ticket-title" className="text-lg font-semibold text-[#1E3448]">
          Ny supportssag
        </h2>
        <p className="mt-1 text-sm text-[#4A6478]">
          Opret en sag på vegne af en kunde direkte fra admin-panelet.
        </p>
        <div className="mt-6">
          <TicketForm
            organisations={organisations}
            organisationId={selectedOrganisationId}
            onOrganisationChange={setSelectedOrganisationId}
            onSubmit={handleCreateTicket}
            onCancel={closeNewTicketModal}
            submitting={creatingTicket}
            uploadingFiles={uploadingFiles}
            error={modalError}
            showCancel
            idPrefix="admin-new-ticket"
          />
        </div>
      </Modal>
    </div>
  );
}
