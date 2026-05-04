/** Midlertidig hardcode — én admin. */
export const ADMIN_EMAIL = "kontakt@systemklar.dk";

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
