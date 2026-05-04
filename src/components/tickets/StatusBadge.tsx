export type TicketStatus = "open" | "in_progress" | "closed";

export function formatDanishDateTime(iso: string) {
  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<TicketStatus, { bg: string; text: string; label: string }> = {
    open: { bg: "#DCFCE7", text: "#166534", label: "Åben" },
    in_progress: { bg: "#FEF9C3", text: "#854D0E", label: "I gang" },
    closed: { bg: "#F1F5F9", text: "#475569", label: "Lukket" },
  };
  const normalized =
    status === "open" || status === "in_progress" || status === "closed"
      ? status
      : "closed";
  const s = styles[normalized];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
