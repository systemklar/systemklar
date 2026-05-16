"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TicketDetailLayout } from "@/components/tickets/TicketDetailLayout";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
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
    return <p className="text-sm text-[#4A8CB5]">Indlæser sag…</p>;
  }

  if (!ticket) {
    return (
      <div>
        <p className="text-sm text-[#4A8CB5]">Sag ikke fundet.</p>
      </div>
    );
  }

  const customerName = companyFromTicketRow(ticket);

  return (
    <TicketDetailLayout
      ticket={ticket}
      backHref="/admin/tickets"
      customerName={customerName}
      customerProfileHref={`/admin/customers/${ticket.organisation_id}`}
      sendAsAdmin
      useAdminAttachmentsApi
      onStatusChange={(next) => setTicket((t) => (t ? { ...t, status: next } : null))}
    />
  );
}
