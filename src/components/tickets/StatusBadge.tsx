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
  const normalized = status === "nede" ? "nede" : normalizeTicketStatus(status);
  const styles: Record<TicketStatus | "nede", { bg: string; text: string; label: string; dot: string }> = {
    active: { bg: "#FEF3C7", text: "#C2410C", label: "Aktiv", dot: "#D97706" },
    resolved: { bg: "#DCFCE7", text: "#166534", label: "Løst", dot: "#D97706" },
    nede: { bg: "#FEE2E2", text: "#991B1B", label: "Nede", dot: "#DC2626" },
  };
  const s = styles[normalized];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
      {s.label}
    </span>
  );
}
