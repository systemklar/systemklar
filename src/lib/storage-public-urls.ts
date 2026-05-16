/** Public Storage URLs (must match bucket paths in Supabase). */

function supabaseOrigin(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

export function publicAvatarUrl(userId: string): string {
  return `${supabaseOrigin()}/storage/v1/object/public/avatars/${userId}`;
}

export function publicOrganisationLogoUrl(organisationId: string): string {
  return `${supabaseOrigin()}/storage/v1/object/public/organisation-avatars/${organisationId}`;
}

/** Append cache-bust query param (strips any existing query string first). */
export function withCacheBust(url: string, bust: number = Date.now()): string {
  const base = url.trim().split("?")[0] ?? url.trim();
  return `${base}?t=${bust}`;
}

export const PORTAL_PROFILE_AVATAR_UPDATED_EVENT = "portal-profile-avatar-updated";

export function notifyPortalProfileAvatarUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PORTAL_PROFILE_AVATAR_UPDATED_EVENT));
  }
}
