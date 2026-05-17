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
      <h1 className="text-xl font-bold leading-snug text-[#1E3448] md:text-2xl">
        <span className="sr-only">{formatTicketNumber(ticket.ticket_number)} </span>
        {ticket.title}
      </h1>
      {subtitle ? <p className="text-sm text-[#4A6478]">{subtitle}</p> : null}
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#4A6478]">
        <div>
          <dt className="inline font-medium text-[#7A9AB0]">Oprettet: </dt>
          <dd className="inline">{formatDanishDateTime(ticket.created_at)}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-[#7A9AB0]">Opdateret: </dt>
          <dd className="inline">{formatDanishDateTime(updatedAt)}</dd>
        </div>
      </dl>
      {showExpectedResponse && isActive ? (
        <p className="rounded-lg border border-[#C8D8E4] bg-[#EAF1F7] px-3 py-2 text-sm text-[#4A6478]">
          Forventet svartid: inden for 1 hverdag
        </p>
      ) : null}
    </header>
  );
}
