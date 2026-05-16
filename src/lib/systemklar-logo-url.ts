/** Absolut URL til `/public/logo.png` (e-mails, server-genereret HTML). */
export function systemklarLogoPngAbsoluteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://systemklar.dk";
  return `${raw.replace(/\/$/, "")}/logo.png`;
}
