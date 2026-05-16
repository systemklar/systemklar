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
