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
  if (s === "ok") return "text-[#0A7C5C]";
  if (s === "advarsel") return "text-[#C47B0A]";
  if (s === "fejl") return "text-[#C42B2B]";
  return "text-[#2C4A5E]";
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

const DS = {
  accent: "#0A6EBD",
  navy: "#062840",
  pageBg: "#F5FAFD",
  card: "#FFFFFF",
  text: "#0D1F2D",
  textSecondary: "#2C4A5E",
  helper: "#7AAEC8",
  border: "#D0E8F5",
  ok: "#0A7C5C",
  warn: "#C47B0A",
  err: "#C42B2B",
} as const;

const SIGNOFF_CHECK_SVG = `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0">
  <circle cx="22" cy="22" r="20" fill="#E8F7F0" stroke="${DS.ok}" stroke-width="2"/>
  <path d="M13 22.5l6 6 12-16" stroke="${DS.ok}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

export function buildItReportHtmlDocument(input: ItReportHtmlInput): string {
  const { organisationName, periodLabel, aiSummary, aiRecommendations, content, forPrint } = input;
  const bullets = recommendationsToBullets(aiRecommendations);
  const t = content.tickets;

  const ticketRows = t.rows
    .map((row) => {
      const st = (row.status || "").toLowerCase();
      const stLabel = st === "resolved" ? "Løst" : "Åben";
      const stBg = st === "resolved" ? "#E8F7F0" : "#E8F2FC";
      const stCol = st === "resolved" ? DS.ok : DS.accent;
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};color:${DS.text};">${escapeHtml(row.title)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};"><span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${stBg};color:${stCol};">${stLabel}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};font-size:12px;color:${DS.textSecondary};">${escapeHtml(formatDaDateTime(row.created_at))}</td>
      </tr>`;
    })
    .join("");

  const sysRows = content.monitoring.bySystem
    .map((row) => {
      const raw = (row.lastStatus || "").toLowerCase();
      const st = normalizeMonitoringStatusForDisplay(row.lastStatus);
      const col =
        raw === "ok"
          ? DS.ok
          : raw === "advarsel"
            ? DS.warn
            : raw === "fejl"
              ? DS.err
              : DS.helper;
      const last = row.lastChecked ? formatDaDateTime(row.lastChecked) : "—";
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};font-weight:600;color:${DS.text};">${escapeHtml(row.friendlyName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};color:${col};font-weight:600;">${escapeHtml(st)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};color:${DS.textSecondary};">${row.uptimePercent}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.border};font-size:12px;color:${DS.helper};">${escapeHtml(last)}</td>
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
      ? `<ul style="margin:0;padding-left:1.1rem;color:${DS.textSecondary};line-height:1.6;">${bullets.map((b) => `<li style="margin-bottom:6px;">${escapeHtml(b)}</li>`).join("")}</ul>`
      : `<p style="color:${DS.helper};">—</p>`;

  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(organisationName)} — IT-statusrapport</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
  <style>
    ${printCss}
    * { box-sizing: border-box; }
    body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; color: ${DS.text}; background: ${DS.pageBg}; }
    .header { background: ${DS.navy}; color: #fff; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .wordmark { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #fff; text-transform: lowercase; }
    .wordmark::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 999px; background: #fff; margin-right: 10px; vertical-align: middle; }
    .header h1 { margin: 0; font-size: 15px; font-weight: 300; letter-spacing: 0.14em; text-transform: none; color: #fff; text-align: right; }
    .sub { padding: 20px 24px 22px; border-bottom: 1px solid ${DS.border}; background: ${DS.card}; }
    .sub h2 { margin: 0 0 6px; font-size: 22px; font-weight: 700; color: ${DS.text}; letter-spacing: -0.02em; }
    .sub p { margin: 0; font-size: 15px; color: ${DS.textSecondary}; line-height: 1.45; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 0 20px 32px; background: ${DS.pageBg}; }
    section { padding: 22px 0; border-bottom: 1px solid ${DS.border}; background: transparent; }
    section h3 { margin: 0 0 14px; padding-left: 12px; border-left: 2px solid ${DS.accent}; font-size: 18px; font-weight: 600; color: ${DS.text}; letter-spacing: -0.01em; }
    .prose { font-size: 15px; line-height: 1.65; color: ${DS.textSecondary}; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid ${DS.border}; border-radius: 8px; overflow: hidden; }
    thead th { text-align: left; padding: 10px 12px; background: ${DS.navy}; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    tbody tr:nth-child(odd) { background: ${DS.card}; }
    tbody tr:nth-child(even) { background: ${DS.pageBg}; }
    tbody td { border-bottom: 1px solid ${DS.border}; }
    tbody tr:last-child td { border-bottom: none; }
    .signoff-wrap { max-width: 720px; margin: 0 auto; padding: 8px 20px 28px; background: ${DS.pageBg}; }
    .signoff { border: 1px solid ${DS.navy}; border-radius: 16px; padding: 24px; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 24px 32px; page-break-inside: avoid; background: ${DS.card}; }
    .signoff-left { flex: 1; min-width: 220px; display: flex; gap: 16px; align-items: flex-start; }
    .signoff-left h4 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: ${DS.text}; line-height: 1.35; }
    .signoff-left p { margin: 0; font-size: 13px; line-height: 1.55; color: ${DS.textSecondary}; max-width: 38rem; }
    .signoff-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; text-align: right; gap: 6px; }
    .signoff-wordmark { font-size: 20px; font-weight: 700; color: ${DS.accent}; letter-spacing: -0.02em; text-transform: lowercase; }
    .signoff-wordmark::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 999px; background: ${DS.accent}; margin-right: 8px; vertical-align: middle; }
    .signoff-right .domain { font-size: 12px; color: ${DS.helper}; font-weight: 500; }
    .footer { text-align: center; font-size: 12px; color: ${DS.helper}; padding: 18px 16px 28px; border-top: 1px solid ${DS.border}; background: ${DS.pageBg}; text-transform: lowercase; }
  </style>
</head>
<body>
  <div class="header">
    <span class="wordmark">systemklar</span>
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
        <tbody>${sysRows || `<tr><td colspan="4" style="padding:14px;color:${DS.helper};">Ingen overvågningsdata i perioden.</td></tr>`}</tbody>
      </table>
    </section>
    <section>
      <h3>Support &amp; sager</h3>
      <p style="margin:0 0 14px;font-size:15px;color:${DS.textSecondary};">
        <strong style="color:${DS.text};">${t.totalCreated}</strong> sager oprettet · <strong style="color:${DS.text};">${t.resolved}</strong> løst · <strong style="color:${DS.text};">${t.open}</strong> åbne
      </p>
      <table>
        <thead><tr><th>Titel</th><th>Status</th><th>Oprettet</th></tr></thead>
        <tbody>${ticketRows || `<tr><td colspan="3" style="padding:14px;color:${DS.helper};">Ingen sager i perioden.</td></tr>`}</tbody>
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
          <p>Denne rapport er udarbejdet på baggrund af data fra dit IT-miljø og er gennemgået og godkendt af Systemklar inden udsendelse. Vi står altid klar til at hjælpe hvis du har spørgsmål.</p>
        </div>
      </div>
      <div class="signoff-right">
        <span class="signoff-wordmark">systemklar</span>
        <span class="domain">systemklar.dk</span>
      </div>
    </div>
  </div>
  <div class="footer">systemklar · systemklar.dk · kontakt@systemklar.dk</div>
</body>
</html>`;
}

export function periodLabelDa(periodStart: string, periodEnd: string): string {
  return `${formatDaDate(periodStart)} — ${formatDaDate(periodEnd)}`;
}
