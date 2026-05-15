"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { TicketStatusToggle } from "@/components/tickets/TicketStatusToggle";
import { TicketAttachmentsPanel } from "@/components/tickets/TicketAttachmentsPanel";
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

      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-3">
        <div className="min-h-[60vh] lg:col-span-2">
          <TicketMessageThread
            ticketId={ticket.id}
            organisationId={ticket.organisation_id}
            sendAsAdmin={true}
            customerCompanyLabel={companyFromTicketRow(ticket)}
            fullHeight
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Sag-info</p>
            <h1 className="text-base font-semibold text-[#0D1F2D]">{ticket.title}</h1>
            <p className="mt-2 text-sm text-[#4A8CB5]">
              <span className="font-medium text-[#0D1F2D]">{companyFromTicketRow(ticket)}</span>
              {emailDisplay ? (
                <>
                  <span> · </span>
                  <span>{emailDisplay}</span>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-[#4A8CB5]">Oprettet {formatDanishDateTime(ticket.created_at)}</p>
            <div className="mt-3">
              <TicketStatusToggle
                ticketId={ticket.id}
                status={ticket.status}
                onUpdated={(next) =>
                  setTicket((t) => (t ? { ...t, status: next } : null))
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">
              Beskrivelse
            </p>
            {ticket.description ? (
              <p className="whitespace-pre-wrap text-sm text-[#2C4A5E]">{ticket.description}</p>
            ) : (
              <p className="text-sm text-[#4A8CB5]">Ingen beskrivelse.</p>
            )}
          </section>

          <TicketAttachmentsPanel
            ticketId={ticket.id}
            organisationId={ticket.organisation_id}
            useAdminApi
          />
        </aside>
      </div>
    </div>
  );
}
