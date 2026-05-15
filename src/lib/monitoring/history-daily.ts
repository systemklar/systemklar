export type MonitoringHistoryRow = {
  system_name: string;
  status: string;
  checked_at: string;
};

export type DailyPctOkPoint = {
  date: string;
  pctOk: number;
  sampleSize: number;
};

/** Seneste status pr. system pr. kalenderdag (UTC yyyy-mm-dd), derefter andel OK. */
export function buildDailyPctOkFromRows(
  rows: MonitoringHistoryRow[],
  sinceMs: number,
): DailyPctOkPoint[] {
  const filtered = rows.filter((r) => new Date(r.checked_at).getTime() >= sinceMs);
  const byDay = new Map<string, MonitoringHistoryRow[]>();
  for (const r of filtered) {
    const day = r.checked_at.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(r);
    byDay.set(day, list);
  }

  const out: DailyPctOkPoint[] = [];
  for (const [day, list] of byDay) {
    const latestBySystem = new Map<string, MonitoringHistoryRow>();
    for (const r of list) {
      const prev = latestBySystem.get(r.system_name);
      if (!prev || new Date(r.checked_at) > new Date(prev.checked_at)) {
        latestBySystem.set(r.system_name, r);
      }
    }
    const vals = [...latestBySystem.values()];
    if (vals.length < 1) continue;
    const ok = vals.filter((v) => (v.status || "").toLowerCase() === "ok").length;
    out.push({
      date: day,
      pctOk: Math.round((ok / vals.length) * 1000) / 10,
      sampleSize: vals.length,
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
