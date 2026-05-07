"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { TicketStatusToggle } from "@/components/tickets/TicketStatusToggle";
import { TicketMessageThread } from "@/components/tickets/TicketMessageThread";
import { setTicketLastViewedToNow } from "@/lib/ticket-last-viewed";

export default function AdminTicketDetailClient() {
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
    const res = await fetch(`/api/admin/tickets/${id}`, { credentials: "same-origin" });
    const payload = (await res.json().catch(() => ({}))) as {
      ticket?: TicketWithProfileRow;
      error?: string;
    };

    if (!res.ok || !payload.ticket) {
      console.error("[admin/ticket] load failed", payload.error ?? res.status);
      setTicket(null);
    } else {
      setTicket(payload.ticket);
    }
    setTicketLoading(false);
  }, [id]);

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
        <Link href="/admin/tickets" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Tilbage til Support & sager
        </Link>
        <p className="mt-6 text-sm text-slate-600">Sag ikke fundet.</p>
      </div>
    );
  }

  const emailDisplay = ticket.profiles?.email?.trim();

  return (
    <div>
      <Link href="/admin/tickets" className="text-sm font-semibold text-blue-600 hover:underline">
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
            <TicketStatusToggle
              ticketId={ticket.id}
              status={ticket.status}
              onUpdated={(next) =>
                setTicket((t) => (t ? { ...t, status: next } : null))
              }
            />
          </div>
          {ticket.description ? (
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{ticket.description}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Ingen beskrivelse.</p>
          )}
        </div>

        <TicketMessageThread
          ticketId={ticket.id}
          organisationId={ticket.organisation_id}
          sendAsAdmin={true}
          customerCompanyLabel={companyFromTicketRow(ticket)}
        />
      </div>
    </div>
  );
}
