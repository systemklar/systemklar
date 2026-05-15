import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Globe,
  Lock,
  Mail,
  Monitor,
  Package,
  Receipt,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Zap,
} from "lucide-react";

export type OnboardingSystem = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export type OnboardingSystemGroup = {
  /** Fuld overskrift i onboarding-flowet. */
  label: string;
  /** Kort navn til portal/admin-tabs (fx "Infrastruktur"). */
  shortLabel: string;
  systems: OnboardingSystem[];
};

export const ONBOARDING_SYSTEM_GROUPS: OnboardingSystemGroup[] = [
  {
    label: "Infrastruktur (altid relevant)",
    shortLabel: "Infrastruktur",
    systems: [
      { id: "hjemmeside-oppetid", name: "Hjemmeside / oppetid", icon: Monitor },
      { id: "ssl-certifikat", name: "SSL-certifikat", icon: Lock },
      { id: "domaene-whois", name: "Domæne / WHOIS", icon: Globe },
      { id: "dns-spf-dkim-dmarc", name: "DNS / SPF / DKIM / DMARC", icon: Mail },
      { id: "google-pagespeed", name: "Google PageSpeed", icon: Zap },
    ],
  },
  {
    label: "Sikkerhed",
    shortLabel: "Sikkerhed",
    systems: [
      { id: "hibp", name: "Have I Been Pwned (datalæk)", icon: Shield },
      { id: "1password", name: "1Password Business", icon: Lock },
    ],
  },
  {
    label: "Regnskab",
    shortLabel: "Regnskab",
    systems: [
      { id: "e-conomic", name: "e-conomic", icon: Receipt },
      { id: "billy", name: "Billy", icon: Receipt },
      { id: "dinero", name: "Dinero", icon: Receipt },
      { id: "uniconta", name: "Uniconta", icon: Receipt },
    ],
  },
  {
    label: "Webshop",
    shortLabel: "Webshop",
    systems: [
      { id: "shopify", name: "Shopify", icon: ShoppingCart },
      { id: "woocommerce", name: "WooCommerce", icon: ShoppingCart },
    ],
  },
  {
    label: "Betaling",
    shortLabel: "Betaling",
    systems: [
      { id: "quickpay", name: "Quickpay", icon: CreditCard },
      { id: "stripe", name: "Stripe", icon: CreditCard },
      { id: "nets", name: "Nets", icon: CreditCard },
    ],
  },
  {
    label: "Kommunikation",
    shortLabel: "Kommunikation",
    systems: [
      { id: "microsoft-365", name: "Microsoft 365", icon: Mail },
      { id: "google-workspace", name: "Google Workspace", icon: Mail },
    ],
  },
  {
    label: "Logistik",
    shortLabel: "Logistik",
    systems: [
      { id: "postnord", name: "PostNord", icon: Truck },
      { id: "gls", name: "GLS Danmark", icon: Truck },
      { id: "dao", name: "DAO", icon: Package },
    ],
  },
  {
    label: "HR / løn",
    shortLabel: "HR / løn",
    systems: [
      { id: "visma", name: "Visma", icon: Users },
    ],
  },
];

export const ALL_ONBOARDING_SYSTEMS = ONBOARDING_SYSTEM_GROUPS.flatMap((g) => g.systems);

export function systemNameById(id: string): string {
  return ALL_ONBOARDING_SYSTEMS.find((s) => s.id === id)?.name ?? id;
}

/** Matcher `profiles.onboarding_systems`-værdier (visningsnavne gemt ved onboarding). */
export function onboardingSystemByStoredName(stored: string): OnboardingSystem | null {
  const t = stored.trim();
  if (!t) return null;
  return ALL_ONBOARDING_SYSTEMS.find((s) => s.name === t) ?? null;
}

export type ResolvedOnboardingEntry =
  | { kind: "known"; system: OnboardingSystem }
  | { kind: "unknown"; name: string };

export type OnboardingDashboardGroup = {
  shortLabel: string;
  groupLabel: string;
  items: ResolvedOnboardingEntry[];
};

const UNMATCHED_SHORT = "Øvrige";

/**
 * Gruppér valgte systemer (som gemt i DB) under samme kategorier som onboarding.
 * Ukendte navne samles under "Øvrige" hvis nogen findes.
 */
export function buildOnboardingDashboardGroups(storedNames: Iterable<string>): OnboardingDashboardGroup[] {
  const seen = new Set<string>();
  const orderedNames: string[] = [];
  for (const raw of storedNames) {
    const t = typeof raw === "string" ? raw.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    orderedNames.push(t);
  }

  const unmatched: string[] = [];
  const knownByGroupShort = new Map<string, OnboardingSystem[]>();

  for (const name of orderedNames) {
    const sys = onboardingSystemByStoredName(name);
    if (!sys) {
      unmatched.push(name);
      continue;
    }
    for (const g of ONBOARDING_SYSTEM_GROUPS) {
      if (g.systems.some((s) => s.id === sys.id)) {
        const list = knownByGroupShort.get(g.shortLabel) ?? [];
        list.push(sys);
        knownByGroupShort.set(g.shortLabel, list);
        break;
      }
    }
  }

  const out: OnboardingDashboardGroup[] = [];
  for (const g of ONBOARDING_SYSTEM_GROUPS) {
    const systems = knownByGroupShort.get(g.shortLabel);
    if (!systems?.length) continue;
    out.push({
      shortLabel: g.shortLabel,
      groupLabel: g.label,
      items: systems.map((system) => ({ kind: "known" as const, system })),
    });
  }

  if (unmatched.length > 0) {
    out.push({
      shortLabel: UNMATCHED_SHORT,
      groupLabel: UNMATCHED_SHORT,
      items: unmatched.map((name) => ({ kind: "unknown" as const, name })),
    });
  }

  return out;
}
