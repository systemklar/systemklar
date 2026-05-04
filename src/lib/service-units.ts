export const SERVICE_UNITS = ["månedlig", "time", "engangspris"] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number];

export function formatDkk(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return String(price);
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(n);
}

export function isServiceUnit(s: string): s is ServiceUnit {
  return (SERVICE_UNITS as readonly string[]).includes(s);
}

export function serviceUnitLabel(unit: string): string {
  switch (unit) {
    case "månedlig":
      return "Månedlig";
    case "time":
      return "Time";
    case "engangspris":
      return "Engangspris";
    default:
      return unit;
  }
}
