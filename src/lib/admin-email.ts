const ADMIN_EMAILS = [
  "kontakt@systemklar.dk",
  "benjamin@systemklar.dk",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes((email ?? "").trim().toLowerCase());
}
