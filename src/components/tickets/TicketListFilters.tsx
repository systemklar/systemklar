"use client";

import { TicketStatusFilterTabs } from "@/components/tickets/TicketStatusFilterTabs";
import type { AdminTicketSort, TicketListStatusFilter } from "@/lib/ticket-display";

const filterFieldClass =
  "mt-1.5 w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-[#0D1F2D] outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-[#0A6EBD]/20";
const filterLabelClass = "text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]";

type OrganisationOption = { id: string; name: string };

type TicketListFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter: TicketListStatusFilter;
  onStatusFilterChange: (value: TicketListStatusFilter) => void;
  showStatusTabs?: boolean;
  organisationId?: string;
  onOrganisationChange?: (value: string) => void;
  organisations?: OrganisationOption[];
  sortBy?: AdminTicketSort;
  onSortChange?: (value: AdminTicketSort) => void;
};

export function TicketListFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Søg på titel eller sagsnr…",
  statusFilter,
  onStatusFilterChange,
  showStatusTabs = true,
  organisationId,
  onOrganisationChange,
  organisations,
  sortBy,
  onSortChange,
}: TicketListFiltersProps) {
  const showOrg = organisations && onOrganisationChange && organisationId !== undefined;
  const showSort = sortBy !== undefined && onSortChange;

  return (
    <div className="space-y-4">
      {showStatusTabs ? (
        <TicketStatusFilterTabs value={statusFilter} onChange={onStatusFilterChange} />
      ) : null}
      <div
        className={`grid grid-cols-1 gap-4 ${showOrg && showSort ? "md:grid-cols-2 lg:grid-cols-4" : showOrg || showSort ? "md:grid-cols-2" : ""}`}
      >
        <label className={`block ${showOrg || showSort ? "lg:col-span-2" : ""}`}>
          <span className={filterLabelClass}>Søg</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={filterFieldClass}
          />
        </label>
        {showOrg ? (
          <label className="block">
            <span className={filterLabelClass}>Kunde</span>
            <select
              value={organisationId}
              onChange={(e) => onOrganisationChange(e.target.value)}
              className={filterFieldClass}
            >
              <option value="all">Alle kunder</option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showSort ? (
          <label className="block">
            <span className={filterLabelClass}>Sortering</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as AdminTicketSort)}
              className={filterFieldClass}
            >
              <option value="newest">Nyeste</option>
              <option value="oldest">Ældste</option>
              <option value="updated">Senest opdateret</option>
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
