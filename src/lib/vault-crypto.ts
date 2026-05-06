import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getVaultKey(): Buffer {
  const raw = process.env.VAULT_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("VAULT_ENCRYPTION_KEY mangler.");
  }
  const key = Buffer.from(raw, "utf8");
  if (key.length !== 32) {
    throw new Error("VAULT_ENCRYPTION_KEY skal være præcis 32 tegn.");
  }
  return key;
}

export function encryptVaultPassword(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getVaultKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptVaultPassword(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Ugyldigt krypteret payload-format.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGO, getVaultKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export const VAULT_CATEGORIES = [
  "microsoft",
  "google",
  "regnskab",
  "webshop",
  "hr",
  "it",
  "andet",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export type VaultEntryRow = {
  id: string;
  organisation_id: string;
  name: string;
  username: string | null;
  encrypted_password: string | null;
  url: string | null;
  category: VaultCategory | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultEntryResponse = {
  id: string;
  name: string;
  username: string | null;
  password: string | null;
  url: string | null;
  category: VaultCategory | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function isVaultCategory(value: unknown): value is VaultCategory {
  return typeof value === "string" && (VAULT_CATEGORIES as readonly string[]).includes(value);
}

export function mapVaultRowToResponse(row: VaultEntryRow): VaultEntryResponse {
  let password: string | null = null;
  if (row.encrypted_password) {
    password = decryptVaultPassword(row.encrypted_password);
  }
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password,
    url: row.url,
    category: row.category,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
