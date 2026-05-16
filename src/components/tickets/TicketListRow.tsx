import Link from "next/link";
import type { ReactNode } from "react";
import { formatDanishDateTime, StatusBadge } from "@/components/tickets/StatusBadge";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import { TicketPriorityDot } from "@/components/tickets/TicketPriorityDot";
import { TicketUnreadDot } from "@/components/tickets/TicketUnreadDot";
import { formatTicketListDate } from "@/lib/ticket-display";
import type { TicketWithProfileRow } from "@/lib/tickets-with-profile";

type TicketListRowProps = {
  ticket: TicketWithProfileRow;
  href: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  showCompany?: boolean;
  companyName?: string | null;
  trailing?: ReactNode;
};

export function TicketListRow({
  ticket,
  href,
  lastMessageAt,
  unreadCount = 0,
  showCompany = false,
  companyName,
  trailing,
}: TicketListRowProps) {
  const hasUnread = unreadCount > 0;

  return (
    <li>
      <Link
        href={href}
        className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition-all hover:border-sky-200 hover:shadow-md md:flex-row md:items-center md:gap-4 md:p-5"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <TicketNumberBadge ticketNumber={ticket.ticket_number} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-[#0D1F2D]">{ticket.title}</p>
              <TicketUnreadDot hasUnread={hasUnread} />
              <TicketPriorityDot priority={ticket.priority} />
            </div>
            {showCompany && companyName ? (
              <p className="mt-0.5 text-xs text-[#4A8CB5]">{companyName}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A8CB5]">
              <span>Oprettet {formatTicketListDate(ticket.created_at)}</span>
              {lastMessageAt ? (
                <span>Seneste besked {formatTicketListDate(lastMessageAt)}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-col md:items-end">
          <StatusBadge status={ticket.status} />
          {trailing}
        </div>
      </Link>
    </li>
  );
}

/** Kompakt række til admin grupperede lister. */
export function TicketListRowCompact({
  ticket,
  href,
  lastMessageAt,
  unreadCount = 0,
  trailing,
}: Omit<TicketListRowProps, "showCompany" | "companyName">) {
  const hasUnread = unreadCount > 0;

  return (
    <li className="border-b border-slate-100 last:border-0">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <Link href={href} className="min-w-0 flex-1 transition hover:opacity-90">
          <div className="flex flex-wrap items-center gap-2">
            <TicketNumberBadge ticketNumber={ticket.ticket_number} />
            <p className="font-semibold text-[#0D1F2D]">{ticket.title}</p>
            <TicketUnreadDot hasUnread={hasUnread} />
            <TicketPriorityDot priority={ticket.priority} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#4A8CB5]">
            <span>Oprettet {formatDanishDateTime(ticket.created_at)}</span>
            {lastMessageAt ? (
              <span>Seneste besked {formatTicketListDate(lastMessageAt)}</span>
            ) : null}
          </div>
        </Link>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          {trailing}
        </div>
      </div>
    </li>
  );
}
