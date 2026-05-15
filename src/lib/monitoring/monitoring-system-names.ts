/** Navne som i `profiles.onboarding_systems` (visningsnavne). Kun strenge — bruges også i klient-komponenter. */
export const MONITORING_SYSTEM_NAMES = {
  website: "Hjemmeside / oppetid",
  ssl: "SSL-certifikat",
  whois: "Domæne / WHOIS",
  dns: "DNS / SPF / DKIM / DMARC",
  pagespeed: "Google PageSpeed",
  hibp: "Have I Been Pwned (datalæk)",
} as const;
