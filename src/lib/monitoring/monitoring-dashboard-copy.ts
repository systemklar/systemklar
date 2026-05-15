import { MONITORING_SYSTEM_NAMES } from "@/lib/monitoring/checks";

export type MonitoringStatusKey = "ok" | "advarsel" | "fejl" | "afventer";

export function normalizeMonitoringStatus(raw: string | undefined): MonitoringStatusKey {
  const s = (raw ?? "afventer").toLowerCase();
  if (s === "ok" || s === "advarsel" || s === "fejl" || s === "afventer") return s;
  return "afventer";
}

/** Kort forklaring til kunden baseret på system + status (+ evt. detaljer). */
export function monitoringCustomerExplanation(
  technicalSystemName: string,
  status: MonitoringStatusKey,
  details: Record<string, unknown>,
): string {
  const t = technicalSystemName.trim();

  if (t === MONITORING_SYSTEM_NAMES.website) {
    if (status === "ok") return "Din hjemmeside er tilgængelig og svarer hurtigt.";
    if (status === "fejl") {
      return "Vi kan ikke nå din hjemmeside. Den kan være nede eller have en teknisk fejl.";
    }
    if (status === "advarsel") {
      return "Din hjemmeside svarer, men langsommere end anbefalet. Det kan påvirke dine besøgende.";
    }
    return "Vi har endnu ikke et komplet tjek af din hjemmeside.";
  }

  if (t === MONITORING_SYSTEM_NAMES.ssl) {
    if (status === "ok") return "Dit SSL-certifikat er gyldigt og beskytter dine besøgende.";
    if (status === "advarsel") {
      return "Dit SSL-certifikat udløber snart. Vi anbefaler at forny det hurtigst muligt.";
    }
    if (status === "fejl") {
      return "Dit SSL-certifikat er ugyldigt eller udløber meget snart. Det bør rettes omgående.";
    }
    return "Vi har endnu ikke tjekket dit SSL-certifikat.";
  }

  if (t === MONITORING_SYSTEM_NAMES.dns) {
    if (status === "ok") return "Din email-opsætning er korrekt og beskytter mod spam og phishing.";
    if (status === "advarsel") {
      return "Din email-opsætning mangler nogle sikkerhedsindstillinger.";
    }
    if (status === "fejl") {
      return "Din email-opsætning mangler vigtige sikkerhedsindstillinger (SPF og/eller DMARC).";
    }
    return "Vi har endnu ikke tjekket din email-opsætning.";
  }

  if (t === MONITORING_SYSTEM_NAMES.whois) {
    if (status === "ok") return "Dit domæne er registreret med god udløbsmargin.";
    if (status === "advarsel") {
      return "Dit domæne udløber snart. Husk at forny det så din hjemmeside ikke går ned.";
    }
    if (status === "fejl") {
      return "Dit domæne udløber meget snart eller kunne ikke verificeres. Forny eller kontakt os.";
    }
    return "Vi har endnu ikke tjekket dit domæne.";
  }

  if (t === MONITORING_SYSTEM_NAMES.pagespeed) {
    if (status === "ok") return "Din hjemmeside scorer godt på hastighed på mobil.";
    if (status === "fejl") {
      return "Din hjemmeside loader langsomt. Det kan påvirke dine besøgendes oplevelse.";
    }
    if (status === "advarsel") {
      return "Din hjemmeside kunne være hurtigere på mobil. Der er plads til forbedring.";
    }
    return "Vi har endnu ikke målt din hjemmesides hastighed.";
  }

  if (t === MONITORING_SYSTEM_NAMES.hibp) {
    if (details.skipped) {
      return "Datalæk-tjek er ikke aktiveret (mangler API-nøgle). Kontakt os hvis du ønsker det slået til.";
    }
    return "Vi tjekker løbende om din virksomheds email-domæne er dukket op i kendte datalæk.";
  }

  if (status === "fejl") {
    return "Noget er galt. Kontakt os via support hvis du har spørgsmål.";
  }

  if (status === "advarsel") {
    return "Noget kræver opmærksomhed. Kontakt os via support hvis du har spørgsmål.";
  }

  if (status === "ok") return "Alt ser fint ud ud fra seneste tjek.";

  return "Vi afventer opsætning eller et fuldt tjek af dette punkt.";
}

/** Viser detaljer fra API som korte linjer (ikke rå JSON). */
export function formatMonitoringDetailsLines(details: Record<string, unknown>): string[] {
  if (!details || typeof details !== "object") return [];

  const lines: string[] = [];
  const skip = new Set([
    "not_implemented",
    "skipped",
    "system_name",
    "error",
    "message",
    "reason",
  ]);

  const n = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "boolean") return v ? "Ja" : "Nej";
    return null;
  };

  const code = n(details.status_code);
  const rt = n(details.response_time_ms);
  if (code) lines.push(`HTTP-status: ${code}`);
  if (rt) lines.push(`Svartid: ${rt} ms`);

  const exp = typeof details.expires_at === "string" ? details.expires_at : null;
  const days = n(details.days_remaining);
  if (exp) {
    try {
      const d = new Date(exp);
      if (!Number.isNaN(d.getTime())) {
        lines.push(`Udløber: ${d.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}`);
      }
    } catch {
      lines.push(`Udløber: ${exp}`);
    }
  }
  if (days) lines.push(`Dage til udløb: ${days}`);

  const spf = details.spf_found;
  const dmarc = details.dmarc_found;
  if (typeof spf === "boolean") lines.push(`SPF: ${spf ? "fundet" : "mangler"}`);
  if (typeof dmarc === "boolean") lines.push(`DMARC: ${dmarc ? "fundet" : "mangler"}`);

  const score = n(details.score);
  if (score) lines.push(`Performance-score (mobil): ${score}/100`);
  for (const key of ["lcp", "cls", "fid"] as const) {
    const v = n(details[key]);
    if (v) lines.push(`${key.toUpperCase()}: ${v}`);
  }

  const bc = n(details.breach_count);
  const lb = typeof details.latest_breach === "string" ? details.latest_breach : null;
  if (bc) lines.push(`Kendte datalæk (domæne): ${bc}`);
  if (lb) {
    try {
      const d = new Date(lb);
      lines.push(
        `Seneste hændelse: ${
          Number.isNaN(d.getTime()) ? lb : d.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })
        }`,
      );
    } catch {
      lines.push(`Seneste hændelse: ${lb}`);
    }
  }

  if (details.error && lines.length === 0) {
    const err = n(details.error);
    if (err) lines.push(`Fejl: ${err}`);
  }

  for (const [k, v] of Object.entries(details)) {
    if (skip.has(k)) continue;
    if (["status_code", "response_time_ms", "expires_at", "days_remaining", "spf_found", "dmarc_found", "score", "lcp", "cls", "fid", "breach_count", "latest_breach"].includes(k)) {
      continue;
    }
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "object") continue;
    const s = n(v);
    if (s) lines.push(`${k}: ${s}`);
  }

  return lines;
}

export function statusBadgeClasses(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "border border-emerald-200 bg-emerald-50 text-emerald-900";
    case "advarsel":
      return "border border-amber-200 bg-amber-50 text-amber-950";
    case "fejl":
      return "border border-red-200 bg-red-50 text-red-900";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function statusBadgeLabel(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "OK";
    case "advarsel":
      return "Advarsel";
    case "fejl":
      return "Fejl";
    default:
      return "Afventer";
  }
}
