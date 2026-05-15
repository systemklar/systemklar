import { MONITORING_SYSTEM_NAMES } from "@/lib/monitoring/monitoring-system-names";

export type MonitoringStatusKey = "ok" | "advarsel" | "fejl" | "afventer";

/** Supabase/Postgres kan returnere `details` som JSON-objekt eller som JSON-streng. */
export function parseMonitoringDetails(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return {};
    try {
      const parsed = JSON.parse(t) as unknown;
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function normalizeMonitoringStatus(raw: string | undefined): MonitoringStatusKey {
  const s = (raw ?? "afventer").toLowerCase();
  if (s === "ok" || s === "advarsel" || s === "fejl" || s === "afventer") return s;
  return "afventer";
}

/** Kort forklaring til kunden baseret på system + status (+ evt. detaljer). */
export function monitoringCustomerExplanation(
  technicalSystemName: string,
  status: MonitoringStatusKey,
  details: unknown,
): string {
  const d = parseMonitoringDetails(details);
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
      const scRaw = d.status_code;
      const sc =
        typeof scRaw === "number"
          ? scRaw
          : typeof scRaw === "string"
            ? Number.parseInt(scRaw, 10)
            : NaN;
      if (sc === 429) {
        return "Google PageSpeed-tjenesten er midlertidigt utilgængelig. Vi prøver igen næste time.";
      }
      return "Din hjemmeside loader langsomt. Det kan påvirke dine besøgendes oplevelse.";
    }
    if (status === "advarsel") {
      return "Din hjemmeside kunne være hurtigere på mobil. Der er plads til forbedring.";
    }
    return "Vi har endnu ikke målt din hjemmesides hastighed.";
  }

  if (t === MONITORING_SYSTEM_NAMES.hibp) {
    if (d.skipped) {
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

/** Viser udvalgte felter fra `details` som korte danske linjer (ingen rå JSON, ingen interne felter). */
export function formatMonitoringDetailsLines(details: unknown): string[] {
  const d = parseMonitoringDetails(details);
  const lines: string[] = [];

  const statusCode = d.status_code;
  if (statusCode !== null && statusCode !== undefined && statusCode !== "") {
    const code =
      typeof statusCode === "number" && Number.isFinite(statusCode)
        ? Math.trunc(statusCode)
        : typeof statusCode === "string" && statusCode.trim()
          ? Number.parseInt(statusCode.trim(), 10)
          : NaN;
    if (Number.isFinite(code)) lines.push(`HTTP-status: ${code}`);
  }

  const rt = d.response_time_ms;
  if (typeof rt === "number" && Number.isFinite(rt)) {
    lines.push(`Svartid: ${Math.round(rt)} ms`);
  } else if (typeof rt === "string" && rt.trim() && Number.isFinite(Number(rt))) {
    lines.push(`Svartid: ${Math.round(Number(rt))} ms`);
  }

  const daysRaw = d.days_remaining;
  if (daysRaw !== null && daysRaw !== undefined && daysRaw !== "") {
    const days =
      typeof daysRaw === "number" && Number.isFinite(daysRaw)
        ? daysRaw
        : typeof daysRaw === "string" && daysRaw.trim()
          ? Number(daysRaw)
          : NaN;
    if (Number.isFinite(days)) {
      const rounded = Math.abs(days - Math.round(days)) < 1e-6 ? Math.round(days) : Math.round(days * 10) / 10;
      lines.push(`Udløber om: ${rounded} dage`);
    }
  }

  const exp = d.expires_at;
  if (typeof exp === "string" && exp.trim()) {
    const dt = new Date(exp);
    if (!Number.isNaN(dt.getTime())) {
      lines.push(
        `Udløbsdato: ${dt.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}`,
      );
    }
  }

  if (typeof d.spf_found === "boolean") {
    lines.push(d.spf_found ? "SPF: Fundet ✓" : "SPF: Mangler");
  }
  if (typeof d.dmarc_found === "boolean") {
    lines.push(d.dmarc_found ? "DMARC: Fundet ✓" : "DMARC: Mangler");
  }

  const scoreRaw = d.score;
  if (scoreRaw !== null && scoreRaw !== undefined && scoreRaw !== "") {
    const score =
      typeof scoreRaw === "number" && Number.isFinite(scoreRaw)
        ? Math.round(scoreRaw)
        : typeof scoreRaw === "string" && scoreRaw.trim()
          ? Math.round(Number(scoreRaw))
          : NaN;
    if (Number.isFinite(score)) lines.push(`PageSpeed score: ${score}/100`);
  }

  if (typeof d.breach_count === "number" && Number.isFinite(d.breach_count) && d.breach_count >= 0) {
    lines.push(`Kendte datalæk: ${Math.trunc(d.breach_count)}`);
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
