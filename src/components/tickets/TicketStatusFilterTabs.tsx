import type { TicketListStatusFilter } from "@/lib/ticket-display";

const OPTIONS: { value: TicketListStatusFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktive" },
  { value: "resolved", label: "Løste" },
];

type TicketStatusFilterTabsProps = {
  value: TicketListStatusFilter;
  onChange: (value: TicketListStatusFilter) => void;
};

export function TicketStatusFilterTabs({ value, onChange }: TicketStatusFilterTabsProps) {
  return (
    <div
      className="inline-flex rounded-full border border-sky-100 bg-sky-50/80 p-0.5"
      role="tablist"
      aria-label="Filtrer sager efter status"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            value === opt.value
              ? "bg-white text-sky-800 shadow-sm"
              : "text-[#4A8CB5] hover:text-[#0D1F2D]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
