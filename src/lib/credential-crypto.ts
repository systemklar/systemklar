import { decryptVaultPassword, encryptVaultPassword } from "@/lib/vault-crypto";

const B64_PREFIX = "b64:";

export type CredentialFieldsPayload = {
  version: 1;
  fields: Record<string, string>;
};

export function encryptCredentialPayload(payload: CredentialFieldsPayload): string {
  const json = JSON.stringify(payload);
  try {
    return encryptVaultPassword(json);
  } catch {
    return `${B64_PREFIX}${Buffer.from(json, "utf8").toString("base64")}`;
  }
}

export function decryptCredentialPayload(encrypted: string): CredentialFieldsPayload {
  let json: string;
  if (encrypted.startsWith(B64_PREFIX)) {
    json = Buffer.from(encrypted.slice(B64_PREFIX.length), "base64").toString("utf8");
  } else {
    json = decryptVaultPassword(encrypted);
  }
  const parsed = JSON.parse(json) as CredentialFieldsPayload;
  if (parsed?.version !== 1 || !parsed.fields || typeof parsed.fields !== "object") {
    throw new Error("Ugyldigt credential payload.");
  }
  return parsed;
}
