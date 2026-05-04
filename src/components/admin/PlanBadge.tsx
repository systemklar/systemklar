export type ProfilePlan = "basis" | "standard" | "plus";

const planStyles: Record<
  ProfilePlan,
  { bg: string; text: string; label: string }
> = {
  basis: { bg: "#F1F5F9", text: "#475569", label: "Basis" },
  standard: { bg: "#DBEAFE", text: "#1D4ED8", label: "Standard" },
  plus: { bg: "#F3E8FF", text: "#7E22CE", label: "Plus" },
};

export function PlanBadge({ plan }: { plan: string }) {
  const normalized =
    plan === "basis" || plan === "standard" || plan === "plus" ? plan : "basis";
  const s = planStyles[normalized];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
