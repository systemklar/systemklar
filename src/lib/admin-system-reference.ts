import {
  ALL_ONBOARDING_SYSTEMS,
  ONBOARDING_SYSTEM_GROUPS,
  type OnboardingSystem,
} from "@/lib/onboarding-systems";
import { isAutoMonitoredCustomerSystem } from "@/lib/monitoring/monitoring-system-names";
import { isSelfServiceCredentialSystem } from "@/lib/system-self-service-setup";

export type SystemIntegrationType = "automatic" | "api-key" | "oauth" | "manual";

export type SystemMonitoringStatus = "active" | "pending" | "unsupported";

export type AdminSystemReference = {
  systemId: string;
  categoryShortLabel: string;
  description: string;
  integrationType: SystemIntegrationType;
  integrationDifficulty: "let" | "mellem" | "svær";
  monitoringStatus: SystemMonitoringStatus;
  supportUrl?: string;
  docsUrl?: string;
  statusUrl?: string;
  setupGuideUrl?: string;
  adminSetupNotes: string[];
};

const INTEGRATION_LABELS: Record<SystemIntegrationType, string> = {
  automatic: "Automatisk",
  "api-key": "API-nøgle",
  oauth: "OAuth",
  manual: "Manuel",
};

const MONITORING_STATUS_LABELS: Record<SystemMonitoringStatus, string> = {
  active: "Overvågning aktiv",
  pending: "Afventer opsætning",
  unsupported: "Ikke understøttet endnu",
};

export function integrationTypeLabel(type: SystemIntegrationType): string {
  return INTEGRATION_LABELS[type];
}

export function monitoringStatusLabel(status: SystemMonitoringStatus): string {
  return MONITORING_STATUS_LABELS[status];
}

/** Extended metadata keyed by onboarding system id. */
const REFERENCE_BY_ID: Record<string, Omit<AdminSystemReference, "systemId" | "categoryShortLabel">> = {
  "hjemmeside-oppetid": {
    description:
      "Tjekker om kundens hjemmeside svarer og måler grundlæggende tilgængelighed via domænet.",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk", "Sørg for korrekt primært domæne på organisationen"],
  },
  "ssl-certifikat": {
    description: "Overvåger SSL-certifikatets udløb og gyldighed for kundens domæne.",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk"],
  },
  "domaene-whois": {
    description: "Holder øje med domæneregistrering, udløb og WHOIS-ændringer.",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk"],
  },
  "dns-spf-dkim-dmarc": {
    description: "Validerer DNS-poster for e-mail (SPF, DKIM, DMARC) og opdager fejlkonfiguration.",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk"],
  },
  "google-pagespeed": {
    description: "Måler hastighed og Core Web Vitals via Google PageSpeed Insights.",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk"],
  },
  hibp: {
    description: "Tjekker om organisationens e-maildomæne er ramt af kendte datalæk (Have I Been Pwned).",
    integrationType: "automatic",
    integrationDifficulty: "let",
    monitoringStatus: "active",
    adminSetupNotes: ["Kræver kun domænenavn — overvåges automatisk"],
  },
  "1password": {
    description: "Password manager til teams — kan integreres for sikkerhedsoverblik.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://support.1password.com",
    docsUrl: "https://developer.1password.com",
    adminSetupNotes: ["Kræver Business-konto og service account — ikke automatiseret i Systemklar endnu"],
  },
  "e-conomic": {
    description: "Dansk regnskabssystem — API-adgang til status og grundlæggende helbredstjek.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "active",
    supportUrl: "https://support.e-conomic.com",
    docsUrl: "https://www.e-conomic.com/developer",
    statusUrl: "https://status.e-conomic.com",
    setupGuideUrl: "https://www.e-conomic.com/developer/connect",
    adminSetupNotes: ["Brug Private Token fra Indstillinger → Apps & integrations", "Demo adgang / Privat adgang i e-conomic"],
  },
  billy: {
    description: "Cloud-regnskab til SMV — overvågning via Billys REST API.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "active",
    supportUrl: "https://www.billy.dk/support",
    docsUrl: "https://www.billy.dk/api",
    adminSetupNotes: ["API-nøgle under Indstillinger → API", "Kunden skal generere nøgle med passende rettigheder"],
  },
  dinero: {
    description: "Regnskab og fakturering — API-nøgle til forbindelse og status.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "active",
    supportUrl: "https://dinero.dk/support",
    docsUrl: "https://api.dinero.dk",
    adminSetupNotes: ["API-nøgle under Min profil → API-nøgler"],
  },
  uniconta: {
    description: "ERP/regnskab — kræver særskilt integration.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://www.uniconta.com/support",
    docsUrl: "https://www.uniconta.com/api-documentation",
    adminSetupNotes: ["Kræver Uniconta-partneraftale — ikke automatiseret endnu"],
  },
  shopify: {
    description: "Webshop-platform — overvågning via privat app og Admin API.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "active",
    supportUrl: "https://help.shopify.com",
    docsUrl: "https://shopify.dev/api",
    statusUrl: "https://www.shopifystatus.com",
    setupGuideUrl: "https://shopify.dev/docs/apps/build/authentication-authorization",
    adminSetupNotes: [
      "Opret privat app under Indstillinger → Apps → Udvikl apps",
      "Giv læserettigheder til Ordrer og Produkter",
    ],
  },
  woocommerce: {
    description: "WordPress-webshop — kræver site-specifik plugin eller API.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://woocommerce.com/support",
    docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs",
    adminSetupNotes: ["Kræver WooCommerce REST API-nøgler på kundens WordPress — ikke standardiseret endnu"],
  },
  quickpay: {
    description: "Betalingsgateway — API til transaktions- og gateway-status.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "pending",
    supportUrl: "https://support.quickpay.net",
    docsUrl: "https://learn.quickpay.net/tech-talk/api",
    adminSetupNotes: ["API-nøgle fra Quickpay manager → Indstillinger"],
  },
  stripe: {
    description: "International betalingsplatform — secret key til API-overvågning.",
    integrationType: "api-key",
    integrationDifficulty: "mellem",
    monitoringStatus: "active",
    supportUrl: "https://support.stripe.com",
    docsUrl: "https://stripe.com/docs/api",
    statusUrl: "https://status.stripe.com",
    adminSetupNotes: ["Secret key fra dashboard.stripe.com → Developers → API keys", "Brug sk_live_ eller sk_test_ afhængigt af miljø"],
  },
  nets: {
    description: "Dansk betalingsløsning — kræver Nets-aftale og særintegration.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://www.nets.eu/da-da/kundeservice",
    docsUrl: "https://developers.nets.eu",
    adminSetupNotes: ["Kræver merchant-aftale med Nets — ikke automatiseret endnu"],
  },
  "microsoft-365": {
    description: "Microsoft 365 / Exchange — overvågning via Microsoft Graph.",
    integrationType: "oauth",
    integrationDifficulty: "svær",
    monitoringStatus: "pending",
    supportUrl: "https://support.microsoft.com",
    docsUrl: "https://learn.microsoft.com/en-us/graph",
    statusUrl: "https://status.office.com",
    adminSetupNotes: ["Kræver OAuth via Azure AD app registration", "Admin consent for organisationen"],
  },
  "google-workspace": {
    description: "Google Workspace — Gmail, Drive og admin via Google APIs.",
    integrationType: "oauth",
    integrationDifficulty: "svær",
    monitoringStatus: "pending",
    supportUrl: "https://support.google.com/a",
    docsUrl: "https://developers.google.com/workspace",
    statusUrl: "https://www.google.com/appsstatus/dashboard",
    adminSetupNotes: ["Kræver OAuth via Google Cloud Console", "Service account eller bruger-delegering"],
  },
  postnord: {
    description: "Fragt og pakkesporing — fuld API kræver partneraftale.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://www.postnord.dk/kundeservice",
    docsUrl: "https://developer.postnord.com",
    adminSetupNotes: ["Kræver partner-aftale for fuld API-adgang"],
  },
  gls: {
    description: "GLS fragt — integration via GLS Business eller partner-API.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://gls-group.com/DK/da/kundeservice",
    docsUrl: "https://gls-group.com/DK/da/developers",
    adminSetupNotes: ["Kræver partner-aftale for fuld API-adgang"],
  },
  dao: {
    description: "DAO distribution — API til pakkeshops og forsendelser.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://www.dao.as/kundeservice",
    docsUrl: "https://api.dao.as",
    adminSetupNotes: ["Kræver partner-aftale for fuld API-adgang"],
  },
  visma: {
    description: "HR og løn (Visma) — kræver Visma Developer-portal og aftale.",
    integrationType: "manual",
    integrationDifficulty: "svær",
    monitoringStatus: "unsupported",
    supportUrl: "https://www.visma.dk/kundeservice",
    docsUrl: "https://developer.vismaonline.com",
    adminSetupNotes: ["Kræver Visma-partneraftale — ikke automatiseret endnu"],
  },
};

function categoryForSystemId(systemId: string): string {
  for (const g of ONBOARDING_SYSTEM_GROUPS) {
    if (g.systems.some((s) => s.id === systemId)) return g.shortLabel;
  }
  return "Øvrige";
}

function defaultReferenceFor(system: OnboardingSystem): Omit<AdminSystemReference, "systemId" | "categoryShortLabel"> {
  const auto = isAutoMonitoredCustomerSystem(system.name);
  const selfService = isSelfServiceCredentialSystem(system.name);
  return {
    description: `${system.name} — overvåges som del af kundens valgte systemer.`,
    integrationType: auto ? "automatic" : selfService ? "api-key" : "manual",
    integrationDifficulty: auto ? "let" : "mellem",
    monitoringStatus: auto || selfService ? "active" : "unsupported",
    adminSetupNotes: auto ? ["Kræver kun domænenavn — overvåges automatisk"] : [],
  };
}

export function getAdminSystemReference(system: OnboardingSystem): AdminSystemReference {
  const extra = REFERENCE_BY_ID[system.id] ?? defaultReferenceFor(system);
  return {
    systemId: system.id,
    categoryShortLabel: categoryForSystemId(system.id),
    ...extra,
  };
}

export const ADMIN_SYSTEM_CATALOG: AdminSystemReference[] = ALL_ONBOARDING_SYSTEMS.map((system) =>
  getAdminSystemReference(system),
);

export const ADMIN_SYSTEM_CATEGORY_TABS = [
  "Alle",
  ...ONBOARDING_SYSTEM_GROUPS.map((g) => g.shortLabel),
] as const;

export type AdminSystemCategoryTab = (typeof ADMIN_SYSTEM_CATEGORY_TABS)[number];

export function systemMatchesCategory(
  ref: AdminSystemReference,
  tab: AdminSystemCategoryTab,
): boolean {
  if (tab === "Alle") return true;
  return ref.categoryShortLabel === tab;
}

export function systemMatchesSearch(
  system: OnboardingSystem,
  ref: AdminSystemReference,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    system.name,
    system.id,
    ref.categoryShortLabel,
    ref.description,
    integrationTypeLabel(ref.integrationType),
    ...ref.adminSetupNotes,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export type SystemCustomerUsage = {
  organisationId: string;
  organisationName: string;
};

export type SystemUsageByName = Record<string, { count: number; customers: SystemCustomerUsage[] }>;
