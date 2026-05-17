import { formatTicketNumber } from "@/lib/ticket-display";

type TicketNumberBadgeProps = {
  ticketNumber: number | null | undefined;
  className?: string;
};

export function TicketNumberBadge({ ticketNumber, className = "" }: TicketNumberBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md bg-[#EEF2FA] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#2A4868] ${className}`}
    >
      {formatTicketNumber(ticketNumber)}
    </span>
  );
}
