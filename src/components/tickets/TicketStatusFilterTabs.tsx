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
      className="inline-flex rounded-full border border-[#CBD5E8] bg-[#E8EEFC]/80 p-0.5"
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
              ? "bg-white text-[#0A1628] shadow-sm"
              : "text-[#2A4868] hover:text-[#0A1628]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
