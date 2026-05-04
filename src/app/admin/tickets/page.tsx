"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import { formatDanishDateTime, StatusBadge, type TicketStatus } from "@/components/tickets/StatusBadge";
import {
  companyFromTicketRow,
  normalizeTicketWithProfile,
  TICKET_SELECT_WITH_PROFILE,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

const ALL_ROWS_DUMMY_ID = "00000000-0000-0000-0000-000000000000";

export default function AdminTicketsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [wipeBusy, setWipeBusy] = useState<"messages" | "tickets" | null>(null);
  const [wipeError, setWipeError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setWipeError(null);
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

  const wipeMessages = async () => {
    if (!confirm("Slet ALLE beskeder i databasen? Dette kan ikke fortrydes.")) return;
    setWipeBusy("messages");
    setWipeError(null);
    const { error } = await supabase.from("messages").delete().neq("id", ALL_ROWS_DUMMY_ID);
    if (error) {
      console.error("[admin/tickets] wipe messages", error);
      setWipeError(error.message);
    }
    setWipeBusy(null);
    await loadTickets();
  };

  const wipeTickets = async () => {
    if (
      !confirm(
        "Slet ALLE tickets (beskeder slettes også via database-cascade)? Dette kan ikke fortrydes.",
      )
    ) {
      return;
    }
    setWipeBusy("tickets");
    setWipeError(null);
    const { error: msgErr } = await supabase.from("messages").delete().neq("id", ALL_ROWS_DUMMY_ID);
    if (msgErr) {
      console.error("[admin/tickets] wipe messages before tickets", msgErr);
      setWipeError(msgErr.message);
      setWipeBusy(null);
      return;
    }
    const { error: tErr } = await supabase.from("tickets").delete().neq("id", ALL_ROWS_DUMMY_ID);
    if (tErr) {
      console.error("[admin/tickets] wipe tickets", tErr);
      setWipeError(tErr.message);
    }
    setWipeBusy(null);
    await loadTickets();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Support & sager</h1>
          <p className="mt-2 text-sm text-slate-600">Alle tickets på tværs af brugere.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
          <p className="font-semibold">Midlertidig oprydning (dev)</p>
          <p className="mt-1 text-xs text-amber-900/90">Kun til test – sletter hele tabellen.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={wipeBusy !== null}
              onClick={() => void wipeMessages()}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {wipeBusy === "messages" ? "Sletter..." : "Slet alle beskeder"}
            </button>
            <button
              type="button"
              disabled={wipeBusy !== null}
              onClick={() => void wipeTickets()}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
            >
              {wipeBusy === "tickets" ? "Sletter..." : "Slet alle tickets"}
            </button>
          </div>
          {wipeError && <p className="mt-2 text-xs text-red-700">{wipeError}</p>}
        </div>
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
                <StatusBadge status={t.status as TicketStatus} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
