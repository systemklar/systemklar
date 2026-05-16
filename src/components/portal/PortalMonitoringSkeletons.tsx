/** Shared loading placeholders while monitoring API data is in flight. */

export function PortalDashboardHeroSkeleton() {
  return (
    <div
      className="flex max-h-[120px] items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3"
      aria-hidden
    >
      <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-sky-100" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-5 w-40 max-w-full animate-pulse rounded bg-sky-100" />
        <div className="h-3 w-28 animate-pulse rounded bg-sky-100/90" />
      </div>
    </div>
  );
}

export function PortalDashboardTicketRowSkeleton() {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-sky-50 py-3 last:border-b-0 sm:flex-nowrap">
      <div className="h-4 min-w-0 flex-1 max-w-[12rem] animate-pulse rounded bg-sky-100" />
      <div className="h-3 w-20 animate-pulse rounded bg-sky-100/90" />
      <div className="h-6 w-14 animate-pulse rounded-full bg-sky-100" />
      <div className="h-3 w-12 animate-pulse rounded bg-sky-100/90" />
    </li>
  );
}

export function PortalDashboardSystemRowSkeleton() {
  return (
    <li className="flex items-center gap-3 border-b border-sky-50 px-4 py-4 last:border-b-0">
      <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-100" />
      <div className="h-4 min-w-0 flex-1 max-w-[14rem] animate-pulse rounded bg-sky-100" />
      <div className="hidden h-3 w-20 animate-pulse rounded bg-sky-100/90 sm:block" />
      <div className="h-3 w-16 animate-pulse rounded bg-sky-100/90" />
    </li>
  );
}

export function PortalSystemsOverviewRowSkeleton() {
  return (
    <div className="border-b border-[#D0E8F5]/80 py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
        <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-sky-100" />
        <div className="h-4 min-w-0 flex-1 max-w-[12rem] animate-pulse rounded bg-sky-100" />
        <div className="h-6 w-28 shrink-0 animate-pulse rounded-full bg-sky-100" />
        <div className="hidden h-3 w-28 animate-pulse rounded bg-sky-100/90 sm:inline sm:w-36" />
      </div>
    </div>
  );
}
