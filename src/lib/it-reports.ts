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
  /**
   * Origin for static assets (no trailing slash), e.g. https://systemklar.dk.
   * Use in PDF downloads and iframe srcdoc so `/logo.png` resolves correctly.
   */
  assetBaseUrl?: string | null;
};

/** Absolute or root-relative URL to `public/logo.png`. */
export function itReportLogoUrl(assetBaseUrl?: string | null): string {
  const b = (assetBaseUrl ?? "").trim().replace(/\/$/, "");
  return b ? `${b}/logo.png` : "/logo.png";
}

const SIGNOFF_CHECK_SVG = `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0">
  <circle cx="22" cy="22" r="20" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
  <path d="M13 22.5l6 6 12-16" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

export function buildItReportHtmlDocument(input: ItReportHtmlInput): string {
  const { organisationName, periodLabel, aiSummary, aiRecommendations, content, forPrint, assetBaseUrl } = input;
  const logoSrc = itReportLogoUrl(assetBaseUrl);
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
       body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       @media print {
         html, body { min-height: 100vh; }
         body { display: flex; flex-direction: column; }
         .wrap { flex: 1 1 auto; }
         .signoff-wrap { margin-top: auto; }
       }`
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
    .header { background: #062840; color: #fff; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .header-brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .header-brand img { height: 40px; width: auto; max-width: 200px; object-fit: contain; display: block; }
    .header h1 { margin: 0; flex: 1; text-align: right; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; }
    .sub { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .sub h2 { margin: 0 0 4px; font-size: 20px; color: #062840; }
    .sub p { margin: 0; color: #64748b; font-size: 14px; }
    section { padding: 20px; border-bottom: 1px solid #e2e8f0; }
    section h3 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #062840; }
    .prose { font-size: 14px; line-height: 1.65; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { text-align: left; padding: 8px 12px; background: #f1f5f9; color: #062840; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .signoff-wrap { max-width: 720px; margin: 32px auto 0; padding: 0 20px 24px; }
    .signoff { border: 1px solid #062840; border-radius: 10px; padding: 20px 22px; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 20px 28px; page-break-inside: avoid; background: #fff; }
    .signoff-left { flex: 1; min-width: 200px; display: flex; gap: 16px; align-items: flex-start; }
    .signoff-left h4 { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #062840; line-height: 1.35; }
    .signoff-left p { margin: 0; font-size: 12px; line-height: 1.55; color: #64748b; max-width: 36rem; }
    .signoff-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; text-align: right; gap: 6px; }
    .signoff-right img { width: 80px; height: auto; object-fit: contain; display: block; }
    .signoff-right .domain { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-brand">
      <img src="${escapeHtml(logoSrc)}" alt="Systemklar" width="200" height="40" />
    </div>
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
  <div class="signoff-wrap">
    <div class="signoff">
      <div class="signoff-left">
        ${SIGNOFF_CHECK_SVG}
        <div>
          <h4>Personligt gennemgået af Systemklar</h4>
          <p>Denne rapport er udarbejdet på baggrund af data fra dit IT-miljø og er gennemgået og godkendt af en IT-konsulent hos Systemklar inden udsendelse. Vi står til rådighed hvis du har spørgsmål.</p>
        </div>
      </div>
      <div class="signoff-right">
        <img src="${escapeHtml(logoSrc)}" alt="" width="80" height="32" />
        <span class="domain">systemklar.dk</span>
      </div>
    </div>
  </div>
  <div class="footer">Systemklar · systemklar.dk · Udarbejdet og kvalitetssikret af Systemklar IT</div>
</body>
</html>`;
}

export function periodLabelDa(periodStart: string, periodEnd: string): string {
  return `${formatDaDate(periodStart)} — ${formatDaDate(periodEnd)}`;
}
