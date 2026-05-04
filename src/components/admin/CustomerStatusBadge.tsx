export type CustomerStatus = "active" | "paused" | "churned";

const styles: Record<CustomerStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "#DCFCE7", text: "#166534", label: "Aktiv" },
  paused: { bg: "#FEF9C3", text: "#854D0E", label: "Pause" },
  churned: { bg: "#F1F5F9", text: "#64748B", label: "Afsluttet" },
};

export function CustomerStatusBadge({ status }: { status: string }) {
  const normalized =
    status === "active" || status === "paused" || status === "churned" ? status : "active";
  const s = styles[normalized];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
