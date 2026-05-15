import * as dns from "node:dns/promises";
import * as tls from "node:tls";

import { MONITORING_SYSTEM_NAMES } from "./monitoring-system-names";

export type MonitoringStatus = "ok" | "advarsel" | "fejl" | "afventer";

export type MonitoringCheckResult = {
  status: MonitoringStatus;
  details: Record<string, unknown>;
};

const UA = "Systemklar-Monitor/1.0";

function msDays(d: Date): number {
  return (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

/** HTTP GET https://{domain}, 10s timeout. */
export async function checkWebsiteUptime(domain: string): Promise<MonitoringCheckResult> {
  const url = `https://${domain}`;
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - t0;
    const code = res.status;
    const details: Record<string, unknown> = { status_code: code, response_time_ms: responseTimeMs };

    if (code >= 500) {
      return { status: "fejl", details };
    }
    if (code >= 200 && code < 400) {
      if (responseTimeMs > 3000) {
        return { status: "advarsel", details };
      }
      return { status: "ok", details };
    }
    if (code >= 400 && code < 500) {
      return { status: "fejl", details };
    }
    return { status: "advarsel", details };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "fejl",
      details: { error: msg.includes("aborted") ? "timeout" : "connection", message: msg },
    };
  }
}

/** TLS-certifikat udløb for host (port 443). */
export function checkSslCertificate(domain: string): Promise<MonitoringCheckResult> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (!cert || !cert.valid_to) {
            resolve({ status: "fejl", details: { error: "no_certificate" } });
            return;
          }
          const expiresAt = new Date(cert.valid_to).toISOString();
          const days = msDays(new Date(cert.valid_to));
          const details: Record<string, unknown> = { expires_at: expiresAt, days_remaining: Math.round(days * 10) / 10 };
          if (days < 7) resolve({ status: "fejl", details });
          else if (days <= 30) resolve({ status: "advarsel", details });
          else resolve({ status: "ok", details });
        } catch (err) {
          socket.destroy();
          resolve({
            status: "fejl",
            details: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    );
    socket.on("error", (err) => {
      resolve({ status: "fejl", details: { error: err.message } });
    });
    socket.setTimeout(12_000, () => {
      socket.destroy();
      resolve({ status: "fejl", details: { error: "tls_timeout" } });
    });
  });
}

/** RDAP (via rdap.org bootstrap) for domæne/registry-udløb. */
export async function checkDomainWhois(domain: string): Promise<MonitoringCheckResult> {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      redirect: "follow",
      headers: { Accept: "application/rdap+json, application/json", "User-Agent": UA },
    });
    if (!res.ok) {
      return {
        status: "advarsel",
        details: { error: "rdap_http", status_code: res.status },
      };
    }
    const data = (await res.json()) as {
      events?: { eventAction?: string; eventDate?: string }[];
    };
    let expiry: Date | null = null;
    for (const ev of data.events ?? []) {
      const action = (ev.eventAction ?? "").toLowerCase();
      if (
        action.includes("expiration") ||
        action.includes("expiry") ||
        action === "end of term" ||
        action === "registration expiration"
      ) {
        if (ev.eventDate) {
          expiry = new Date(ev.eventDate);
          break;
        }
      }
    }
    if (!expiry || Number.isNaN(expiry.getTime())) {
      return {
        status: "advarsel",
        details: { error: "no_expiry_in_rdap", raw_events: (data.events ?? []).length },
      };
    }
    const days = msDays(expiry);
    const expiresAt = expiry.toISOString();
    const details: Record<string, unknown> = {
      expires_at: expiresAt,
      days_remaining: Math.round(days * 10) / 10,
    };
    if (days < 14) return { status: "fejl", details };
    if (days <= 60) return { status: "advarsel", details };
    return { status: "ok", details };
  } catch (e) {
    return {
      status: "advarsel",
      details: { error: e instanceof Error ? e.message : String(e) },
    };
  }
}

export async function checkDnsSpfDmarc(domain: string): Promise<MonitoringCheckResult> {
  let spfFound = false;
  let dmarcFound = false;
  try {
    const rootTxts = await dns.resolveTxt(domain).catch(() => [] as string[][]);
    for (const chunks of rootTxts) {
      const joined = chunks.join("").toLowerCase();
      if (joined.includes("v=spf1")) spfFound = true;
    }
    const dmarcHost = `_dmarc.${domain}`;
    const dmarcTxts = await dns.resolveTxt(dmarcHost).catch(() => [] as string[][]);
    for (const chunks of dmarcTxts) {
      const joined = chunks.join("").toLowerCase();
      if (joined.includes("v=dmarc1")) dmarcFound = true;
    }
    const details = { spf_found: spfFound, dmarc_found: dmarcFound };
    if (spfFound && dmarcFound) return { status: "ok", details };
    if (!spfFound && !dmarcFound) return { status: "fejl", details };
    return { status: "advarsel", details };
  } catch (e) {
    return {
      status: "fejl",
      details: {
        spf_found: spfFound,
        dmarc_found: dmarcFound,
        error: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

export async function checkGooglePageSpeed(
  domain: string,
  apiKey: string | undefined,
): Promise<MonitoringCheckResult> {
  const target = `https://${domain}`;
  const keyParam = apiKey && apiKey.length > 0 ? `&key=${encodeURIComponent(apiKey)}` : "";
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=mobile${keyParam}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const raw = await res.text();
    if (!res.ok) {
      return {
        status: "fejl",
        details: { error: "pagespeed_http", status_code: res.status, body_preview: raw.slice(0, 200) },
      };
    }
    const data = JSON.parse(raw) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number | null } };
        audits?: Record<string, { numericValue?: number; displayValue?: string }>;
      };
    };
    const perf = data.lighthouseResult?.categories?.performance?.score;
    const score =
      typeof perf === "number" && !Number.isNaN(perf) ? Math.round(perf * 100) : null;
    const audits = data.lighthouseResult?.audits ?? {};
    const lcp = audits["largest-contentful-paint"]?.displayValue ?? audits["largest-contentful-paint"]?.numericValue;
    const cls = audits["cumulative-layout-shift"]?.displayValue ?? audits["cumulative-layout-shift"]?.numericValue;
    const fid = audits["max-potential-fid"]?.displayValue ?? audits["max-potential-fid"]?.numericValue;

    const details: Record<string, unknown> = { score, lcp: lcp ?? null, cls: cls ?? null, fid: fid ?? null };

    if (score === null) {
      return { status: "fejl", details: { ...details, error: "no_score" } };
    }
    if (score < 50) return { status: "fejl", details };
    if (score < 70) return { status: "advarsel", details };
    return { status: "ok", details };
  } catch (e) {
    return {
      status: "fejl",
      details: { error: e instanceof Error ? e.message : String(e) },
    };
  }
}

type HibpBreach = { Name?: string; BreachDate?: string; AddedDate?: string };

export async function checkHibpDomain(
  domain: string,
  apiKey: string | undefined,
): Promise<MonitoringCheckResult> {
  if (!apiKey || !apiKey.trim()) {
    return {
      status: "afventer",
      details: { skipped: true, reason: "missing_hibp_api_key" },
    };
  }
  const url = `https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Systemklar-Monitor",
        "hibp-api-key": apiKey.trim(),
      },
    });
    if (res.status === 404) {
      return { status: "ok", details: { breach_count: 0, latest_breach: null } };
    }
    if (!res.ok) {
      return {
        status: "fejl",
        details: { error: "hibp_http", status_code: res.status },
      };
    }
    const list = (await res.json()) as HibpBreach[];
    const breaches = Array.isArray(list) ? list : [];
    const breach_count = breaches.length;
    let latest: Date | null = null;
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    let hasRecent = false;
    for (const b of breaches) {
      const dStr = b.BreachDate || b.AddedDate;
      if (!dStr) continue;
      const d = new Date(dStr);
      if (!Number.isNaN(d.getTime())) {
        if (!latest || d > latest) latest = d;
        if (d.getTime() > oneYearAgo) hasRecent = true;
      }
    }
    const details: Record<string, unknown> = {
      breach_count,
      latest_breach: latest?.toISOString() ?? null,
    };
    if (breach_count === 0) return { status: "ok", details };
    if (hasRecent) return { status: "fejl", details };
    return { status: "advarsel", details };
  } catch (e) {
    return {
      status: "fejl",
      details: { error: e instanceof Error ? e.message : String(e) },
    };
  }
}

export { MONITORING_SYSTEM_NAMES };

export async function runCheckForSystemName(
  systemName: string,
  domain: string,
  env: { googlePageSpeedKey?: string; hibpApiKey?: string },
): Promise<MonitoringCheckResult> {
  switch (systemName) {
    case MONITORING_SYSTEM_NAMES.website:
      return checkWebsiteUptime(domain);
    case MONITORING_SYSTEM_NAMES.ssl:
      return checkSslCertificate(domain);
    case MONITORING_SYSTEM_NAMES.whois:
      return checkDomainWhois(domain);
    case MONITORING_SYSTEM_NAMES.dns:
      return checkDnsSpfDmarc(domain);
    case MONITORING_SYSTEM_NAMES.pagespeed:
      return checkGooglePageSpeed(domain, env.googlePageSpeedKey);
    case MONITORING_SYSTEM_NAMES.hibp:
      return checkHibpDomain(domain, env.hibpApiKey);
    default:
      return {
        status: "afventer",
        details: { not_implemented: true, system_name: systemName },
      };
  }
}
