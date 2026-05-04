"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import { formatDanishDateTime, StatusBadge } from "@/components/tickets/StatusBadge";
import {
  companyFromTicketRow,
  normalizeTicketWithProfile,
  TICKET_SELECT_WITH_PROFILE,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export default function AdminTicketsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_SELECT_WITH_PROFILE)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/tickets] fetch", error);
      setTickets([]);
      setUnreadByTicket({});
    } else {
      const rows = (data ?? [])
        .map((r) => normalizeTicketWithProfile(r as unknown as Record<string, unknown>))
        .filter((x): x is TicketWithProfileRow => x !== null);
      setTickets(rows);
      const unread = await fetchUnreadMessageCountsByTicket(
        supabase,
        rows.map((t) => t.id),
      );
      setUnreadByTicket(unread);
    }
    setTicketsLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTickets();
    });
  }, [loadTickets]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Support & sager</h1>
        <p className="mt-2 text-sm text-slate-600">Alle tickets på tværs af brugere.</p>
      </div>

      {ticketsLoading ? (
        <p className="mt-8 text-sm text-slate-500">Henter tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ingen tickets.</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {tickets.map((t) => (
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
                  <p className="mt-1 text-xs text-slate-500">{companyFromTicketRow(t)}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{formatDanishDateTime(t.created_at)}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
