import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/tickets/StatusBadge";
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
  /** Admin: organisation name shown between nummer and titel */
  customerName?: string | null;
  trailing?: ReactNode;
};

export function TicketListRow({
  ticket,
  href,
  lastMessageAt,
  unreadCount = 0,
  customerName,
  trailing,
}: TicketListRowProps) {
  const hasUnread = unreadCount > 0;

  return (
    <li className="flex items-stretch gap-2 rounded-2xl border border-[#D4C9A8] bg-white shadow-sm transition-all hover:border-[#D4C9A8] hover:shadow-md">
      <Link
        href={href}
        className="min-w-0 flex-1 p-4 md:p-5"
      >
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-2">
            <TicketNumberBadge ticketNumber={ticket.ticket_number} />
            <TicketUnreadDot hasUnread={hasUnread} />
            <span className="md:hidden">
              <StatusBadge status={ticket.status} />
            </span>
          </div>

          {customerName ? (
            <p className="text-sm font-medium text-[#5C5A48] md:max-w-[10rem] md:truncate lg:max-w-[12rem]">
              {customerName}
            </p>
          ) : (
            <span className="hidden lg:block" aria-hidden />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-[#2C3020]">{ticket.title}</p>
              <TicketPriorityDot priority={ticket.priority} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#5C5A48]">
              <span>Oprettet {formatTicketListDate(ticket.created_at)}</span>
              {lastMessageAt ? (
                <span>Seneste besked {formatTicketListDate(lastMessageAt)}</span>
              ) : (
                <span className="text-[#A8A090]">Ingen beskeder endnu</span>
              )}
            </div>
          </div>

          <span className="hidden md:inline-flex">
            <StatusBadge status={ticket.status} />
          </span>
        </div>
      </Link>

      {trailing ? (
        <div className="flex shrink-0 items-center border-l border-[#E8E2D0] px-3 md:px-4">
          {trailing}
        </div>
      ) : null}
    </li>
  );
}

/** @deprecated Use TicketListRow */
export function TicketListRowCompact(props: TicketListRowProps) {
  return <TicketListRow {...props} />;
}
