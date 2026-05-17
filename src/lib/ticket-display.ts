import { normalizeTicketStatus, type TicketStatus } from "@/components/tickets/StatusBadge";

export type TicketPriority = "low" | "medium" | "high";

export type TicketListStatusFilter = "all" | "active" | "resolved";

export type AdminTicketSort = "newest" | "oldest" | "updated";

/** Viser fx #0042 eller #1042 (min. 4 cifre). */
export function formatTicketEmailLabel(
  ticketNumber: number | null | undefined,
  title: string,
): string {
  const num = formatTicketNumber(ticketNumber);
  const t = title.trim();
  if (num === "#—") return t;
  return `${num} — ${t}`;
}

export function formatTicketNumber(ticketNumber: number | null | undefined): string {
  if (ticketNumber == null || !Number.isFinite(ticketNumber) || ticketNumber < 1) {
    return "#—";
  }
  return `#${String(Math.floor(ticketNumber)).padStart(4, "0")}`;
}

export function normalizeTicketPriority(raw: string | null | undefined): TicketPriority {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "low" || s === "lav") return "low";
  if (s === "high" || s === "høj" || s === "hoj") return "high";
  return "medium";
}

export const TICKET_PRIORITY_STYLES: Record<
  TicketPriority,
  { dot: string; label: string; title: string }
> = {
  low: { dot: "bg-slate-400", label: "Lav", title: "Lav prioritet" },
  medium: { dot: "bg-[#C4A84F]", label: "Medium", title: "Medium prioritet" },
  high: { dot: "bg-[#B85C4A]", label: "Høj", title: "Høj prioritet" },
};

export function ticketMatchesStatusFilter(
  status: string,
  filter: TicketListStatusFilter,
): boolean {
  const normalized = normalizeTicketStatus(status) as TicketStatus;
  if (filter === "all") return true;
  if (filter === "resolved") return normalized === "resolved";
  return normalized !== "resolved";
}

export function ticketSearchHaystack(parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

export function ticketMatchesSearch(
  haystack: string,
  query: string,
  ticketNumber?: number | null,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (haystack.includes(q)) return true;
  if (ticketNumber != null && Number.isFinite(ticketNumber)) {
    const num = String(Math.floor(ticketNumber));
    const formatted = formatTicketNumber(ticketNumber).toLowerCase();
    if (num.includes(q.replace(/^#/, "")) || formatted.includes(q)) return true;
  }
  return false;
}

export function sortTickets<T extends { created_at: string; updated_at?: string | null }>(
  rows: T[],
  sort: AdminTicketSort,
): T[] {
  const copy = [...rows];
  if (sort === "oldest") {
    copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return copy;
  }
  if (sort === "updated") {
    copy.sort((a, b) => {
      const au = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
      const bu = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
      return bu - au;
    });
    return copy;
  }
  copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return copy;
}

export function formatTicketListDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
