"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TicketAttachmentsPanel } from "@/components/tickets/TicketAttachmentsPanel";
import { TicketDetailHeader } from "@/components/tickets/TicketDetailHeader";
import { TicketMessageThread } from "@/components/tickets/TicketMessageThread";
import { TicketStatusToggle } from "@/components/tickets/TicketStatusToggle";
import type { TicketWithProfileRow } from "@/lib/tickets-with-profile";

export type TicketDetailLayoutProps = {
  ticket: TicketWithProfileRow;
  backHref: string;
  backLabel?: string;
  customerName: string;
  customerProfileHref?: string;
  sendAsAdmin: boolean;
  useAdminAttachmentsApi?: boolean;
  showExpectedResponse?: boolean;
  sidebarFooter?: ReactNode;
  onStatusChange: (status: string) => void;
};

export function TicketDetailLayout({
  ticket,
  backHref,
  backLabel = "← Tilbage til Support & sager",
  customerName,
  customerProfileHref,
  sendAsAdmin,
  useAdminAttachmentsApi = false,
  showExpectedResponse = false,
  sidebarFooter,
  onStatusChange,
}: TicketDetailLayoutProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <Link href={backHref} className="text-sm font-semibold text-[#0A6EBD] hover:underline">
        {backLabel}
      </Link>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-3">
        <div className="min-h-[60vh] lg:col-span-2">
          <TicketMessageThread
            ticketId={ticket.id}
            organisationId={ticket.organisation_id}
            sendAsAdmin={sendAsAdmin}
            customerCompanyLabel={customerName}
            fullHeight
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">
              Sag-info
            </p>
            <TicketDetailHeader
              ticket={ticket}
              showExpectedResponse={showExpectedResponse}
            />
            <dl className="mt-4 space-y-2 border-t border-sky-50 pt-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-[#4A8CB5]">Kunde</dt>
                <dd className="mt-0.5 font-medium text-[#0D1F2D]">
                  {customerProfileHref ? (
                    <Link href={customerProfileHref} className="text-[#0A6EBD] hover:underline">
                      {customerName}
                    </Link>
                  ) : (
                    customerName
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-sky-50 pt-4">
              <p className="mb-2 text-xs font-medium text-[#4A8CB5]">Status</p>
              <TicketStatusToggle
                ticketId={ticket.id}
                status={ticket.status}
                onUpdated={onStatusChange}
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
            useAdminApi={useAdminAttachmentsApi}
          />

          {sidebarFooter}
        </aside>
      </div>
    </div>
  );
}
