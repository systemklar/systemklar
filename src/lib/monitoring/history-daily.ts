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

/**
 * Udfylder manglende kalenderdage i 30-dagesvinduet med senest kendte % OK,
 * så linjegrafen får et sammenhængende forløb (kun meningsfuldt når der allerede er mindst én dag med målinger).
 */
export function expandDailyPctOkToLast30Days(
  points: DailyPctOkPoint[],
  sinceMs: number,
): DailyPctOkPoint[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((p) => [p.date, p]));

  const start = new Date(sinceMs);
  start.setUTCHours(0, 0, 0, 0);

  const out: DailyPctOkPoint[] = [];
  let last: DailyPctOkPoint | null = null;

  for (let i = 0; i < 30; i++) {
    const day = new Date(start.getTime() + i * 86400000);
    const dateKey = day.toISOString().slice(0, 10);
    const hit = byDate.get(dateKey);
    if (hit) {
      last = hit;
      out.push({ date: dateKey, pctOk: hit.pctOk, sampleSize: hit.sampleSize });
    } else if (last) {
      out.push({ date: dateKey, pctOk: last.pctOk, sampleSize: last.sampleSize });
    }
  }

  return out;
}
