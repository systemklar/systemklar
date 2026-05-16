import { TICKET_PRIORITY_STYLES, type TicketPriority } from "@/lib/ticket-display";

type TicketPriorityDotProps = {
  priority: TicketPriority;
  showLabel?: boolean;
};

export function TicketPriorityDot({ priority, showLabel = false }: TicketPriorityDotProps) {
  const s = TICKET_PRIORITY_STYLES[priority];
  return (
    <span className="inline-flex items-center gap-1.5" title={s.title}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
      {showLabel ? <span className="text-xs text-[#4A8CB5]">{s.label}</span> : null}
      <span className="sr-only">{s.title}</span>
    </span>
  );
}
