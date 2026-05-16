/** Kort relativ tid på dansk, fx "for 5 min. siden". */
export function formatRelativeShortDa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "om lidt";
  const rtf = new Intl.RelativeTimeFormat("da", { numeric: "auto" });
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "lige nu";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}
