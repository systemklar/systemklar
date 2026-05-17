"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePortalSession } from "@/components/portal/PortalLayout";
import { TicketListFilters } from "@/components/tickets/TicketListFilters";
import { TicketListRow } from "@/components/tickets/TicketListRow";
import {
  ticketMatchesSearch,
  ticketMatchesStatusFilter,
  ticketSearchHaystack,
  type TicketListStatusFilter,
} from "@/lib/ticket-display";
import { fetchLastMessageAtByTicket } from "@/lib/ticket-messages-meta";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { fetchCurrentProfile } from "@/lib/current-profile";
import {
  normalizeTicketWithProfile,
  TICKET_SELECT_BASE,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export type { TicketWithProfileRow as TicketRow } from "@/lib/tickets-with-profile";

function PortalSupportPageInner() {
  const supabase = useMemo(() => createClient(), []);
  const portalSession = usePortalSession();
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const profile = await fetchCurrentProfile(supabase, user.id);
      if (profile?.organisation_id) setOrgId(profile.organisation_id);
    })();
  }, [supabase]);

  const organisationId = orgId ?? portalSession?.organisationId ?? null;

  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [listLoading, setListLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketListStatusFilter>("all");
  const [lastMessageAtByTicket, setLastMessageAtByTicket] = useState<Record<string, string>>({});
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

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
    const [unread, lastMessages] = await Promise.all([
      fetchUnreadMessageCountsByTicket(supabase, ids),
      fetchLastMessageAtByTicket(supabase, ids),
    ]);
    setUnreadByTicket(unread);
    setLastMessageAtByTicket(lastMessages);
  }, [supabase]);

  const filteredTickets = useMemo(() => {
    const q = debouncedSearch.trim();
    return tickets.filter((t) => {
      if (!ticketMatchesStatusFilter(t.status, statusFilter)) return false;
      if (!q) return true;
      return ticketMatchesSearch(
        ticketSearchHaystack([t.title, String(t.ticket_number ?? "")]),
        q,
        t.ticket_number,
      );
    });
  }, [tickets, debouncedSearch, statusFilter]);

  useEffect(() => {
    void (async () => {
      setListLoading(true);
      await fetchTickets();
      setListLoading(false);
    })();
  }, [fetchTickets]);

  return (
    <div className="flex w-full flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CBD5E8] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Support & sager</h1>
          <p className="mt-2 text-sm text-[#2A4868]">
            Følg åbne sager og opret nye henvendelser til support.
          </p>
        </div>
        <Link
          href="/portal/support/new"
          className="rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E4490]"
        >
          Opret ny sag
        </Link>
      </div>

      <div className="rounded-2xl border border-[#CBD5E8] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#0A1628]">Dine sager</h2>
        <div className="mt-4">
          <TicketListFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Søg i dine sager…"
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {errorMessage}
          </p>
        ) : null}
        {listLoading ? (
          <p className="mt-4 text-sm text-[#2A4868]">Henter sager…</p>
        ) : tickets.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-[#CBD5E8] bg-[#F2F5FA] p-12 text-center">
            <p className="text-sm text-[#2A4868]">
              Du har ingen sager endnu. Opret en sag for at komme i gang.
            </p>
            <Link
              href="/portal/support/new"
              className="mt-5 inline-flex rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E4490]"
            >
              Opret ny sag
            </Link>
          </div>
        ) : filteredTickets.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#2A4868]">Ingen sager matcher din søgning.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {filteredTickets.map((ticket) => (
              <TicketListRow
                key={ticket.id}
                ticket={ticket}
                href={`/portal/support/${ticket.id}`}
                lastMessageAt={lastMessageAtByTicket[ticket.id]}
                unreadCount={unreadByTicket[ticket.id] ?? 0}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PortalSupportPage() {
  return (
    <Suspense fallback={<div className="w-full p-6 text-sm text-[#6A82A8] md:p-8">Indlæser…</div>}>
      <PortalSupportPageInner />
    </Suspense>
  );
}
