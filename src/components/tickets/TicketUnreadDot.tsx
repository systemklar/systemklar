type TicketUnreadDotProps = {
  hasUnread: boolean;
};

/** Blå prik når der er nye beskeder siden sidste besøg (portal). */
export function TicketUnreadDot({ hasUnread }: TicketUnreadDotProps) {
  if (!hasUnread) return null;
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full bg-[#2952A3]"
      aria-label="Nye beskeder"
      title="Nye beskeder"
    />
  );
}
