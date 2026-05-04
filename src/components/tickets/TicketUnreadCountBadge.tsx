type TicketUnreadCountBadgeProps = {
  count: number;
};

export function TicketUnreadCountBadge({ count }: TicketUnreadCountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white"
      aria-label={`${count} ulæste beskeder`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
