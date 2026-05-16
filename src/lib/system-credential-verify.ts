import type { CredentialFieldsPayload } from "@/lib/credential-crypto";
import type { SelfServiceCredentialSystem } from "@/lib/system-self-service-setup";

const FETCH_TIMEOUT_MS = 15_000;

async function fetchOk(url: string, init: RequestInit): Promise<boolean> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function normalizeShopifyHost(shopUrl: string): string | null {
  let host = shopUrl.trim().toLowerCase();
  if (!host) return null;
  host = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host.includes(".")) {
    host = `${host}.myshopify.com`;
  }
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(host)) {
    return null;
  }
  return host;
}

export async function verifySystemCredential(
  systemName: SelfServiceCredentialSystem,
  fields: CredentialFieldsPayload["fields"],
): Promise<{ valid: boolean; message?: string }> {
  switch (systemName) {
    case "e-conomic": {
      const token = fields.privateToken?.trim();
      if (!token) return { valid: false, message: "Mangler Private Token." };
      const valid = await fetchOk("https://restapi.e-conomic.com/self", {
        headers: {
          "X-Auth-Token": token,
          "Content-Type": "application/json",
        },
      });
      return valid
        ? { valid: true }
        : { valid: false, message: "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt." };
    }
    case "Billy": {
      const token = fields.apiKey?.trim();
      if (!token) return { valid: false, message: "Mangler API-nøgle." };
      const valid = await fetchOk("https://api.billysbilling.com/v2/organization", {
        headers: { "X-Access-Token": token },
      });
      return valid
        ? { valid: true }
        : { valid: false, message: "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt." };
    }
    case "Dinero": {
      const token = fields.apiKey?.trim();
      if (!token) return { valid: false, message: "Mangler API-nøgle." };
      const valid = await fetchOk("https://api.dinero.dk/v1/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return valid
        ? { valid: true }
        : { valid: false, message: "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt." };
    }
    case "Shopify": {
      const token = fields.accessToken?.trim();
      const host = normalizeShopifyHost(fields.shopUrl ?? "");
      if (!token || !host) {
        return { valid: false, message: "Udfyld både access token og butiks-URL." };
      }
      const valid = await fetchOk(`https://${host}/admin/api/2024-10/shop.json`, {
        headers: { "X-Shopify-Access-Token": token },
      });
      return valid
        ? { valid: true }
        : { valid: false, message: "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt." };
    }
    case "Stripe": {
      const secret = fields.secretKey?.trim();
      if (!secret?.startsWith("sk_")) {
        return { valid: false, message: "Secret key skal starte med sk_live_ eller sk_test_." };
      }
      const valid = await fetchOk("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      return valid
        ? { valid: true }
        : { valid: false, message: "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt." };
    }
    default:
      return { valid: false, message: "Ukendt system." };
  }
}
