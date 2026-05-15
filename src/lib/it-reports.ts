import { MONITORING_SYSTEM_NAMES } from "@/lib/monitoring/monitoring-system-names";
import { buildDailyPctOkFromRows, expandDailyPctOkToLast30Days } from "@/lib/monitoring/history-daily";

export const IT_REPORTS_TABLE_COLUMNS =
  "id, organisation_id, title, period_start, period_end, content, ai_summary, ai_recommendations, status, pdf_url, created_at, updated_at, sent_at";

export type ITReportStatus = "draft" | "approved" | "sent";

/** Snapshot bundled into `it_reports.content` (versioned). */
export type ITReportContentV1 = {
  version: 1;
  organisationName: string;
  domain: string | null;
  onboardingSystems: string[];
  monitoring: {
    bySystem: Array<{
      technicalName: string;
      friendlyName: string;
      uptimePercent: number;
      lastChecked: string | null;
      lastStatus: string;
    }>;
    dailyPctOk: Array<{ date: string; pctOk: number; sampleSize: number }>;
  };
  tickets: {
    totalCreated: number;
    resolved: number;
    open: number;
    rows: Array<{ id: string; title: string; status: string; created_at: string }>;
  };
};

const FRIENDLY_MONITORING_DA: Record<string, string> = {
  [MONITORING_SYSTEM_NAMES.website]: "Hjemmeside",
  [MONITORING_SYSTEM_NAMES.ssl]: "Sikkerhedscertifikat",
  [MONITORING_SYSTEM_NAMES.dns]: "Email-sikkerhed",
  [MONITORING_SYSTEM_NAMES.whois]: "Domæne",
  [MONITORING_SYSTEM_NAMES.pagespeed]: "Hjemmeside hastighed",
  [MONITORING_SYSTEM_NAMES.hibp]: "Datalæk-tjek",
};

export function friendlyMonitoringSystemName(technicalName: string): string {
  const t = technicalName.trim();
  return FRIENDLY_MONITORING_DA[t] ?? t;
}

export function normalizeMonitoringStatusForDisplay(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s === "ok") return "OK";
  if (s === "advarsel") return "Advarsel";
  if (s === "fejl") return "Fejl";
  if (s === "afventer") return "Afventer";
  return raw || "—";
}

export function statusColorClass(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s === "ok") return "text-emerald-700";
  if (s === "advarsel") return "text-amber-700";
  if (s === "fejl") return "text-red-700";
  return "text-slate-600";
}

type MonRow = { system_name: string; status: string; checked_at: string };

export function buildMonitoringSectionFromRows(
  rows: MonRow[],
  periodStartMs: number,
  periodEndMs: number,
): ITReportContentV1["monitoring"] {
  const inPeriod = rows.filter((r) => {
    const t = new Date(r.checked_at).getTime();
    return !Number.isNaN(t) && t >= periodStartMs && t <= periodEndMs;
  });

  const bySystemName = new Map<string, MonRow[]>();
  for (const r of inPeriod) {
    const list = bySystemName.get(r.system_name) ?? [];
    list.push(r);
    bySystemName.set(r.system_name, list);
  }

  const sinceMs = periodStartMs;
  const rawDaily = buildDailyPctOkFromRows(
    inPeriod.map((r) => ({ system_name: r.system_name, status: r.status, checked_at: r.checked_at })),
    sinceMs,
  );
  const dailyPctOk =
    rawDaily.length >= 2 ? expandDailyPctOkToLast30Days(rawDaily, sinceMs) : rawDaily;

  const bySystem: ITReportContentV1["monitoring"]["bySystem"] = [];
  for (const [technicalName, list] of bySystemName) {
    const sorted = [...list].sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
    const last = sorted[0];
    const okCount = list.filter((x) => (x.status || "").toLowerCase() === "ok").length;
    const uptimePercent = list.length ? Math.round((okCount / list.length) * 1000) / 10 : 0;
    bySystem.push({
      technicalName,
      friendlyName: friendlyMonitoringSystemName(technicalName),
      uptimePercent,
      lastChecked: last?.checked_at ?? null,
      lastStatus: last?.status ?? "afventer",
    });
  }
  bySystem.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName, "da"));

  return { bySystem, dailyPctOk };
}

export function parseItReportContent(raw: unknown): ITReportContentV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  return raw as ITReportContentV1;
}

export function recommendationsToBullets(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDaDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
}

function formatDaDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type ItReportHtmlInput = {
  organisationName: string;
  periodLabel: string;
  aiSummary: string;
  aiRecommendations: string;
  content: ITReportContentV1;
  /** When true, include print @page rules for browser PDF. */
  forPrint: boolean;
};

export function buildItReportHtmlDocument(input: ItReportHtmlInput): string {
  const { organisationName, periodLabel, aiSummary, aiRecommendations, content, forPrint } = input;
  const bullets = recommendationsToBullets(aiRecommendations);
  const t = content.tickets;

  const ticketRows = t.rows
    .map((row) => {
      const st = (row.status || "").toLowerCase();
      const stLabel = st === "resolved" ? "Løst" : "Åben";
      const stBg = st === "resolved" ? "#dcfce7" : "#e0f2fe";
      const stCol = st === "resolved" ? "#166534" : "#0369a1";
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(row.title)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;"><span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${stBg};color:${stCol};">${stLabel}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${escapeHtml(formatDaDateTime(row.created_at))}</td>
      </tr>`;
    })
    .join("");

  const sysRows = content.monitoring.bySystem
    .map((row) => {
      const st = normalizeMonitoringStatusForDisplay(row.lastStatus);
      const col =
        (row.lastStatus || "").toLowerCase() === "ok"
          ? "#166534"
          : (row.lastStatus || "").toLowerCase() === "advarsel"
            ? "#b45309"
            : (row.lastStatus || "").toLowerCase() === "fejl"
              ? "#b91c1c"
              : "#475569";
      const last = row.lastChecked ? formatDaDateTime(row.lastChecked) : "—";
      return `<tr style="background:#fff;">
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${escapeHtml(row.friendlyName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${col};font-weight:600;">${escapeHtml(st)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${row.uptimePercent}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">${escapeHtml(last)}</td>
      </tr>`;
    })
    .join("");

  const printCss = forPrint
    ? `@page { size: A4; margin: 14mm; }
       body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`
    : "";

  const bulletsHtml =
    bullets.length > 0
      ? `<ul style="margin:0;padding-left:1.1rem;color:#334155;line-height:1.55;">${bullets.map((b) => `<li style="margin-bottom:6px;">${escapeHtml(b)}</li>`).join("")}</ul>`
      : `<p style="color:#64748b;">—</p>`;

  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(organisationName)} — IT-statusrapport</title>
  <style>
    ${printCss}
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; color: #0f172a; background: #fff; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
    .header { background: #062840; color: #fff; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .header .brand { font-size: 15px; font-weight: 800; }
    .sub { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .sub h2 { margin: 0 0 4px; font-size: 20px; color: #062840; }
    .sub p { margin: 0; color: #64748b; font-size: 14px; }
    section { padding: 20px; border-bottom: 1px solid #e2e8f0; }
    section h3 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #062840; }
    .prose { font-size: 14px; line-height: 1.65; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { text-align: left; padding: 8px 12px; background: #f1f5f9; color: #062840; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .signoff { margin: 24px 20px; padding: 16px 18px; border: 2px solid #062840; border-radius: 4px; font-size: 14px; color: #062840; font-weight: 600; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">Systemklar</span>
    <h1>IT-statusrapport</h1>
  </div>
  <div class="sub">
    <h2>${escapeHtml(organisationName)}</h2>
    <p>${escapeHtml(periodLabel)}</p>
  </div>
  <div class="wrap">
    <section>
      <h3>Sammenfatning</h3>
      <div class="prose">${escapeHtml(aiSummary).replace(/\n/g, "<br/>")}</div>
    </section>
    <section>
      <h3>Systemstatus</h3>
      <table>
        <thead><tr><th>System</th><th>Status</th><th>Oppetid denne måned</th><th>Senest tjekket</th></tr></thead>
        <tbody>${sysRows || `<tr><td colspan="4" style="padding:12px;color:#64748b;">Ingen overvågningsdata i perioden.</td></tr>`}</tbody>
      </table>
    </section>
    <section>
      <h3>Support &amp; sager</h3>
      <p style="margin:0 0 12px;font-size:14px;color:#334155;">
        <strong>${t.totalCreated}</strong> sager oprettet · <strong>${t.resolved}</strong> løst · <strong>${t.open}</strong> åbne
      </p>
      <table>
        <thead><tr><th>Titel</th><th>Status</th><th>Oprettet</th></tr></thead>
        <tbody>${ticketRows || `<tr><td colspan="3" style="padding:12px;color:#64748b;">Ingen sager i perioden.</td></tr>`}</tbody>
      </table>
    </section>
    <section>
      <h3>Anbefalinger</h3>
      ${bulletsHtml}
    </section>
  </div>
  <div class="signoff">✓ Gennemgået og kvalitetssikret af Systemklar IT</div>
  <div class="footer">Systemklar · systemklar.dk · Udarbejdet og kvalitetssikret af Systemklar IT</div>
</body>
</html>`;
}

export function periodLabelDa(periodStart: string, periodEnd: string): string {
  return `${formatDaDate(periodStart)} — ${formatDaDate(periodEnd)}`;
}
