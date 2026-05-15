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
  label: string;
  systems: OnboardingSystem[];
};

export const ONBOARDING_SYSTEM_GROUPS: OnboardingSystemGroup[] = [
  {
    label: "Infrastruktur (altid relevant)",
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
    systems: [
      { id: "hibp", name: "Have I Been Pwned (datalæk)", icon: Shield },
      { id: "1password", name: "1Password Business", icon: Lock },
    ],
  },
  {
    label: "Regnskab",
    systems: [
      { id: "e-conomic", name: "e-conomic", icon: Receipt },
      { id: "billy", name: "Billy", icon: Receipt },
      { id: "dinero", name: "Dinero", icon: Receipt },
      { id: "uniconta", name: "Uniconta", icon: Receipt },
    ],
  },
  {
    label: "Webshop",
    systems: [
      { id: "shopify", name: "Shopify", icon: ShoppingCart },
      { id: "woocommerce", name: "WooCommerce", icon: ShoppingCart },
    ],
  },
  {
    label: "Betaling",
    systems: [
      { id: "quickpay", name: "Quickpay", icon: CreditCard },
      { id: "stripe", name: "Stripe", icon: CreditCard },
      { id: "nets", name: "Nets", icon: CreditCard },
    ],
  },
  {
    label: "Kommunikation",
    systems: [
      { id: "microsoft-365", name: "Microsoft 365", icon: Mail },
      { id: "google-workspace", name: "Google Workspace", icon: Mail },
    ],
  },
  {
    label: "Logistik",
    systems: [
      { id: "postnord", name: "PostNord", icon: Truck },
      { id: "gls", name: "GLS Danmark", icon: Truck },
      { id: "dao", name: "DAO", icon: Package },
    ],
  },
  {
    label: "HR / løn",
    systems: [
      { id: "visma", name: "Visma", icon: Users },
    ],
  },
];

export const ALL_ONBOARDING_SYSTEMS = ONBOARDING_SYSTEM_GROUPS.flatMap((g) => g.systems);

export function systemNameById(id: string): string {
  return ALL_ONBOARDING_SYSTEMS.find((s) => s.id === id)?.name ?? id;
}
