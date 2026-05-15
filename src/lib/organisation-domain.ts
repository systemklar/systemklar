/**
 * Normaliserer brugerinput til et domænenavn uden protokol/sti/port (gemmes i `organisations.domain`).
 */
export function normalizeOrganisationDomainInput(raw: string): string {
  const input = raw.trim();
  if (!input) return "";

  let candidate = input;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const u = new URL(candidate);
    let host = u.hostname.toLowerCase();
    if (host.endsWith(".")) {
      host = host.slice(0, -1);
    }
    return host;
  } catch {
    return "";
  }
}

/** Tom streng er tilladt (rydder feltet). Ellers skal input kunne parses som værtsnavn. */
export function isLikelyOrganisationDomain(normalized: string): boolean {
  if (normalized === "") return true;
  if (normalized.length > 253) return false;
  if (!normalized.includes(".")) return false;
  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.includes("..")) {
    return false;
  }
  return true;
}
