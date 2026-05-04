export type TicketStatus = "active" | "resolved";

/** Kortlæg gamle DB-værdier og ukendte til active/resolved. */
export function normalizeTicketStatus(raw: string | null | undefined): TicketStatus {
  const s = (raw ?? "").trim();
  if (s === "resolved" || s === "closed") return "resolved";
  return "active";
}

export function formatDanishDateTime(iso: string) {
  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeTicketStatus(status);
  const styles: Record<TicketStatus, { bg: string; text: string; label: string }> = {
    active: { bg: "#FEF3C7", text: "#C2410C", label: "Aktiv" },
    resolved: { bg: "#DCFCE7", text: "#166534", label: "Løst" },
  };
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
