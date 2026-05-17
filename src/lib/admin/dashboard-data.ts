import {
  latestMonitoringByOrgAndSystem,
  type MonitoringResultRow,
} from "@/lib/monitoring/monitoring-results";

export type { MonitoringResultRow };

export type MonitoringStatus = "ok" | "advarsel" | "fejl" | "afventer";

export type MonitoringCounts = {
  ok: number;
  advarsel: number;
  fejl: number;
  afventer: number;
};

export type OrganisationDashboardRow = {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  monitoring: MonitoringCounts;
  openTickets: number;
  lastCheckedAt: string | null;
  worstRank: number;
  rowAccent: "fejl" | "advarsel" | "ok" | null;
};

export type DashboardSystemError = {
  organisation_id: string;
  organisation_name: string;
  system_name: string;
  checked_at: string;
};

export type DashboardPendingReport = {
  id: string;
  organisation_id: string;
  organisation_name: string;
  period_start: string;
  period_end: string;
  status: "draft" | "approved";
};

export type DashboardTicket = {
  id: string;
  ticket_number: number | null;
  title: string;
  status: string;
  created_at: string;
  organisation_id: string;
  organisation_name: string;
};

export type DashboardActivity = {
  organisation_id: string;
  organisation_name: string;
  system_name: string;
  status: MonitoringStatus;
  previous_status: MonitoringStatus;
  checked_at: string;
};

export type DashboardStats = {
  activeCustomers: number;
  systemsWithFejl: number;
  openTickets: number;
  reportsReady: number;
};

const WORST_RANK: Record<string, number> = {
  fejl: 0,
  advarsel: 1,
  ok: 2,
  afventer: 3,
};

export function emptyMonitoringCounts(): MonitoringCounts {
  return { ok: 0, advarsel: 0, fejl: 0, afventer: 0 };
}

export function normalizeMonitoringStatus(raw: string): MonitoringStatus {
  const s = raw.toLowerCase();
  if (s === "ok" || s === "advarsel" || s === "fejl" || s === "afventer") return s;
  return "afventer";
}

export function countsFromLatestBySystem(latest: Map<string, MonitoringResultRow>): MonitoringCounts {
  const counts = emptyMonitoringCounts();
  for (const row of latest.values()) {
    const status = normalizeMonitoringStatus(row.status);
    counts[status] += 1;
  }
  return counts;
}

export function worstRankFromCounts(counts: MonitoringCounts): number {
  if (counts.fejl > 0) return WORST_RANK.fejl;
  if (counts.advarsel > 0) return WORST_RANK.advarsel;
  if (counts.ok > 0) return WORST_RANK.ok;
  const total = counts.ok + counts.advarsel + counts.fejl + counts.afventer;
  return total > 0 ? WORST_RANK.afventer : 4;
}

export function rowAccentFromCounts(counts: MonitoringCounts): "fejl" | "advarsel" | "ok" | null {
  if (counts.fejl > 0) return "fejl";
  if (counts.advarsel > 0) return "advarsel";
  const total = counts.ok + counts.advarsel + counts.fejl + counts.afventer;
  if (total > 0 && counts.fejl === 0 && counts.advarsel === 0 && counts.ok > 0) return "ok";
  return null;
}

export function formatReportPeriodDa(start: string, end: string): string {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} – ${end}`;
  return `${a.toLocaleDateString("da-DK", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function latestMonitoringByOrg(
  rows: { organisation_id: string; system_name: string; status: string; checked_at: string }[],
): Map<string, Map<string, MonitoringResultRow>> {
  return latestMonitoringByOrgAndSystem(rows);
}

export function detectStatusChangeEvents(
  rows: {
    organisation_id: string;
    system_name: string;
    status: string;
    checked_at: string;
  }[],
  sinceMs: number,
  orgNames: Map<string, string>,
  limit = 10,
): DashboardActivity[] {
  const byKey = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.organisation_id}\0${row.system_name}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const events: DashboardActivity[] = [];

  for (const list of byKey.values()) {
    list.sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      if (prev.status === cur.status) continue;
      const curMs = new Date(cur.checked_at).getTime();
      if (curMs < sinceMs) continue;
      events.push({
        organisation_id: cur.organisation_id,
        organisation_name: orgNames.get(cur.organisation_id) ?? "Ukendt",
        system_name: cur.system_name,
        status: normalizeMonitoringStatus(cur.status),
        previous_status: normalizeMonitoringStatus(prev.status),
        checked_at: cur.checked_at,
      });
    }
  }

  events.sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
  return events.slice(0, limit);
}

export const MONITORING_STATUS_COLORS: Record<MonitoringStatus, string> = {
  ok: "#22C78A",
  advarsel: "#F0A030",
  fejl: "#E05040",
  afventer: "#9AAAC8",
};

export const MONITORING_STATUS_LABELS: Record<MonitoringStatus, string> = {
  ok: "OK",
  advarsel: "Advarsel",
  fejl: "Fejl",
  afventer: "Afventer",
};
