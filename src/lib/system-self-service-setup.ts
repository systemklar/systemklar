/** Onboarding `system_name` values (som i `profiles.onboarding_systems`). */
export const SELF_SERVICE_CREDENTIAL_SYSTEMS = [
  "e-conomic",
  "Billy",
  "Dinero",
  "Shopify",
  "Stripe",
] as const;

export type SelfServiceCredentialSystem = (typeof SELF_SERVICE_CREDENTIAL_SYSTEMS)[number];

export type CredentialFieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  sensitive?: boolean;
};

export type SelfServiceSetupConfig = {
  instructionSteps: string[];
  fields: CredentialFieldConfig[];
  helpUrl?: string;
};

const CONFIG: Record<SelfServiceCredentialSystem, SelfServiceSetupConfig> = {
  "e-conomic": {
    instructionSteps: [
      "Gå til din e-conomic konto → Indstillinger → Apps & integrations → Demo adgang / Privat adgang",
      "Kopiér din Private Token",
    ],
    fields: [
      {
        key: "privateToken",
        label: "Private Token",
        placeholder: "Din e-conomic private token",
        sensitive: true,
      },
    ],
    helpUrl: "https://www.e-conomic.com/developer/connect",
  },
  Billy: {
    instructionSteps: [
      "Gå til Billy → Indstillinger → API",
      "Generér en ny API-nøgle og kopiér den",
    ],
    fields: [
      {
        key: "apiKey",
        label: "API-nøgle",
        placeholder: "Din Billy API-nøgle",
        sensitive: true,
      },
    ],
  },
  Dinero: {
    instructionSteps: [
      "Gå til dinero.dk → Min profil → API-nøgler",
      "Kopiér din API-nøgle",
    ],
    fields: [
      {
        key: "apiKey",
        label: "API-nøgle",
        placeholder: "Din Dinero API-nøgle",
        sensitive: true,
      },
    ],
  },
  Shopify: {
    instructionSteps: [
      "Gå til din Shopify butik → Indstillinger → Apps → Udvikl apps",
      "Opret en ny app og giv den læserettigheder til Ordrer og Produkter",
      "Kopiér Admin API access token og din butiks URL",
    ],
    fields: [
      {
        key: "accessToken",
        label: "Admin API Access Token",
        placeholder: "shpat_...",
        sensitive: true,
      },
      {
        key: "shopUrl",
        label: "Butik URL",
        placeholder: "minbutik.myshopify.com",
      },
    ],
  },
  Stripe: {
    instructionSteps: [
      "Gå til dashboard.stripe.com → Developers → API keys",
      "Kopiér din Secret key (starter med sk_live_...)",
    ],
    fields: [
      {
        key: "secretKey",
        label: "Secret Key",
        placeholder: "sk_live_...",
        sensitive: true,
      },
    ],
  },
};

const SELF_SERVICE_SET = new Set<string>(SELF_SERVICE_CREDENTIAL_SYSTEMS);

export function isSelfServiceCredentialSystem(systemName: string): systemName is SelfServiceCredentialSystem {
  return SELF_SERVICE_SET.has(systemName.trim());
}

export function getSelfServiceSetupConfig(systemName: string): SelfServiceSetupConfig | null {
  if (!isSelfServiceCredentialSystem(systemName)) return null;
  return CONFIG[systemName];
}

export function totalSetupSteps(systemName: string): number {
  const cfg = getSelfServiceSetupConfig(systemName);
  if (!cfg) return 0;
  return cfg.instructionSteps.length + 1;
}
