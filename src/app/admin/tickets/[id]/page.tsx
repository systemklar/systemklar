"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  companyFromTicketRow,
  fetchTicketWithProfileById,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { formatDanishDateTime, StatusBadge, type TicketStatus } from "@/components/tickets/StatusBadge";
import { TicketMessageThread } from "@/components/tickets/TicketMessageThread";
import { setTicketLastViewedToNow } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export default function AdminTicketDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [ticket, setTicket] = useState<TicketWithProfileRow | null>(null);
  const [ticketLoading, setTicketLoading] = useState(true);

  const loadTicket = useCallback(async () => {
    if (!id) {
      setTicketLoading(false);
      return;
    }
    setTicketLoading(true);
    const row = await fetchTicketWithProfileById(supabase, id);

    if (!row) {
      console.error("[admin/ticket] load failed");
      setTicket(null);
    } else {
      setTicket(row);
    }
    setTicketLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTicket();
    });
  }, [loadTicket]);

  useEffect(() => {
    if (!ticket?.id) return;
    setTicketLastViewedToNow(ticket.id);
  }, [ticket?.id]);

  if (ticketLoading) {
    return (
      <div>
        <p className="text-sm text-slate-600">Indlæser sag...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <Link href="/admin/tickets" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til Support & sager
        </Link>
        <p className="mt-6 text-sm text-slate-600">Sag ikke fundet.</p>
      </div>
    );
  }

  const emailDisplay = ticket.profiles?.email?.trim();

  return (
    <div>
      <Link href="/admin/tickets" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Tilbage til Support & sager
      </Link>

      <div className="mx-auto mt-6 max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">{companyFromTicketRow(ticket)}</span>
                {emailDisplay ? (
                  <>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-700">{emailDisplay}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-2 text-sm text-slate-500">Oprettet {formatDanishDateTime(ticket.created_at)}</p>
            </div>
            <StatusBadge status={ticket.status as TicketStatus} />
          </div>
          {ticket.description ? (
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{ticket.description}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Ingen beskrivelse.</p>
          )}
        </div>

        <TicketMessageThread ticketId={ticket.id} sendAsAdmin={true} />
      </div>
    </div>
  );
}
