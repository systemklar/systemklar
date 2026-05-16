import { formatDanishDateTime, normalizeTicketStatus, StatusBadge } from "@/components/tickets/StatusBadge";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import { TicketPriorityDot } from "@/components/tickets/TicketPriorityDot";
import { formatTicketNumber } from "@/lib/ticket-display";
import type { TicketWithProfileRow } from "@/lib/tickets-with-profile";

type TicketDetailHeaderProps = {
  ticket: TicketWithProfileRow;
  subtitle?: string | null;
  showExpectedResponse?: boolean;
};

export function TicketDetailHeader({
  ticket,
  subtitle,
  showExpectedResponse = false,
}: TicketDetailHeaderProps) {
  const isActive = normalizeTicketStatus(ticket.status) !== "resolved";
  const updatedAt = ticket.updated_at ?? ticket.created_at;

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <TicketNumberBadge ticketNumber={ticket.ticket_number} className="text-sm" />
        <StatusBadge status={ticket.status} />
        <TicketPriorityDot priority={ticket.priority} showLabel />
      </div>
      <h1 className="text-xl font-bold leading-snug text-[#0D1F2D] md:text-2xl">
        <span className="sr-only">{formatTicketNumber(ticket.ticket_number)} </span>
        {ticket.title}
      </h1>
      {subtitle ? <p className="text-sm text-[#4A8CB5]">{subtitle}</p> : null}
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#4A8CB5]">
        <div>
          <dt className="inline font-medium text-[#7AAEC8]">Oprettet: </dt>
          <dd className="inline">{formatDanishDateTime(ticket.created_at)}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-[#7AAEC8]">Opdateret: </dt>
          <dd className="inline">{formatDanishDateTime(updatedAt)}</dd>
        </div>
      </dl>
      {showExpectedResponse && isActive ? (
        <p className="rounded-lg border border-sky-100 bg-[#F0F7FF] px-3 py-2 text-sm text-[#2C4A5E]">
          Forventet svartid: inden for 1 hverdag
        </p>
      ) : null}
    </header>
  );
}
