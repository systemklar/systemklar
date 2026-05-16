/** Server-safe monitoring row helpers (ingen "use client"). */

export type MonitoringResultRow = {
  system_name: string;
  status: string;
  checked_at: string;
  details?: Record<string, unknown>;
};

/** Seneste række pr. system_name (sorteret checked_at desc). */
export function latestResultPerSystemName(
  rows: MonitoringResultRow[] | null | undefined,
): Map<string, MonitoringResultRow> {
  const sorted = [...(rows ?? [])].sort(
    (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
  );
  const m = new Map<string, MonitoringResultRow>();
  for (const r of sorted) {
    if (!m.has(r.system_name)) m.set(r.system_name, r);
  }
  return m;
}

export type MonitoringResultDbRow = {
  organisation_id: string;
  system_name: string;
  status: string;
  checked_at: string;
};

/** Gruppér rækker per organisation_id, seneste pr. system_name. */
export function latestMonitoringByOrgAndSystem(
  rows: MonitoringResultDbRow[],
): Map<string, Map<string, MonitoringResultRow>> {
  const byOrg = new Map<string, MonitoringResultRow[]>();

  for (const row of rows) {
    const list = byOrg.get(row.organisation_id) ?? [];
    list.push({
      system_name: row.system_name,
      status: row.status,
      checked_at: row.checked_at,
    });
    byOrg.set(row.organisation_id, list);
  }

  const result = new Map<string, Map<string, MonitoringResultRow>>();
  for (const [orgId, list] of byOrg) {
    result.set(orgId, latestResultPerSystemName(list));
  }
  return result;
}
