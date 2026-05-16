"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FileText, Loader2, MessageSquare } from "lucide-react";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import { formatCheckedAgoDa } from "@/components/monitoring/MonitoringStatusBlock";
import {
  formatReportPeriodDa,
  MONITORING_STATUS_COLORS,
  MONITORING_STATUS_LABELS,
  type DashboardPendingReport,
  type DashboardStats,
  type DashboardSystemError,
  type DashboardTicket,
  type MonitoringCounts,
  type MonitoringStatus,
  type OrganisationDashboardRow,
} from "@/lib/admin/dashboard-data";
type DashboardPayload = {
  stats: DashboardStats;
  customers: OrganisationDashboardRow[];
  openTickets: DashboardTicket[];
  systemsWithFejl: DashboardSystemError[];
  pendingReports: DashboardPendingReport[];
  warnings?: string[];
  errors?: string[];
};

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function rowBorderClass(accent: OrganisationDashboardRow["rowAccent"]) {
  if (accent === "fejl") return "border-l-[3px] border-l-[#C42B2B]";
  if (accent === "advarsel") return "border-l-[3px] border-l-[#C47B0A]";
  if (accent === "ok") return "border-l-[3px] border-l-[#0A7C5C]";
  return "border-l-[3px] border-l-transparent";
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 shadow-sm">
      <span className="text-xs font-medium text-[#4A8CB5]">{label}</span>
      <span className="text-sm font-bold tabular-nums text-[#062840]">{value}</span>
    </div>
  );
}

function CountBadge({ count, variant }: { count: number; variant: "neutral" | "danger" }) {
  return (
    <span
      className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
        variant === "danger" && count > 0
          ? "bg-[#C42B2B] text-white"
          : "bg-sky-50 text-[#062840]"
      }`}
    >
      {count}
    </span>
  );
}

function StatusDotCounts({ counts }: { counts: MonitoringCounts }) {
  const items: { key: MonitoringStatus; count: number }[] = [
    { key: "fejl", count: counts.fejl },
    { key: "advarsel", count: counts.advarsel },
    { key: "ok", count: counts.ok },
    { key: "afventer", count: counts.afventer },
  ];
  const total = counts.ok + counts.advarsel + counts.fejl + counts.afventer;
  if (total === 0) {
    return <span className="text-xs text-[#94a3b8]">Ingen data</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4A8CB5]">
      {items.map((item, i) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          {i > 0 ? <span className="text-[#cbd5e1]" aria-hidden>·</span> : null}
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: MONITORING_STATUS_COLORS[item.key] }}
            aria-hidden
          />
          <span className="tabular-nums font-medium text-[#062840]">{item.count}</span>
          <span>{MONITORING_STATUS_LABELS[item.key].toLowerCase()}</span>
        </span>
      ))}
    </div>
  );
}

function reportStatusLabel(status: DashboardPendingReport["status"]) {
  if (status === "draft") return "Kladde";
  return "Godkendt";
}

function CustomerRow({ org }: { org: OrganisationDashboardRow }) {
  return (
    <li
      className={`rounded-xl border border-sky-50 bg-white px-4 py-3 shadow-sm ${rowBorderClass(org.rowAccent)}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <OrganisationLogo
            logoUrl={org.logo_url}
            initials={initialsFromName(org.name)}
            className="h-10 w-10 shrink-0 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#062840]">{org.name}</p>
            <p className="truncate text-xs text-[#4A8CB5]">{org.domain ?? "Intet domæne"}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:px-2">
          <StatusDotCounts counts={org.monitoring} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={`/admin/tickets/new?org=${encodeURIComponent(org.id)}`}
            title="Ny sag"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 text-[#0A6EBD] transition-colors hover:bg-[#F0F7FF]"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            <span className="sr-only">Ny sag</span>
          </Link>
          <Link
            href={`/admin/it-rapporter?org=${encodeURIComponent(org.id)}`}
            title="Rapport"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 text-[#0A6EBD] transition-colors hover:bg-[#F0F7FF]"
          >
            <FileText className="h-4 w-4" aria-hidden />
            <span className="sr-only">Rapport</span>
          </Link>
          <Link
            href={`/admin/customers/${org.id}`}
            title="Se kunde"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 text-[#0A6EBD] transition-colors hover:bg-[#F0F7FF]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">Se kunde</span>
          </Link>
        </div>
      </div>

      {org.openTickets > 0 ? (
        <p className="mt-2">
          <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
            {org.openTickets} åbne sager
          </span>
        </p>
      ) : null}
    </li>
  );
}

function SidebarCard({
  title,
  count,
  countVariant,
  children,
  className,
}: {
  title: string;
  count: number;
  countVariant: "neutral" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-sky-100 bg-white p-5 shadow-sm ${className ?? ""}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#062840]">{title}</h2>
        <CountBadge count={count} variant={countVariant} />
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

export default function AdminDashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "same-origin" });
      const payload = (await res.json().catch(() => ({}))) as DashboardPayload & {
        error?: string;
        errors?: string[];
      };
      if (!res.ok) {
        const detail =
          payload.errors?.join(" ") ||
          payload.error ||
          `Kunne ikke hente dashboard (HTTP ${res.status}).`;
        setError(detail);
        setData(null);
        return;
      }
      setData(payload);
      if (payload.warnings?.length) {
        console.warn("[admin/dashboard] partial data:", payload.warnings);
      }
    } catch (e) {
      console.error("[admin/dashboard] fetch", e);
      setError("Netværksfejl. Prøv igen.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const stats = data?.stats;
  const customers = data?.customers ?? [];
  const openTickets = data?.openTickets ?? [];
  const systemsWithFejl = data?.systemsWithFejl ?? [];
  const pendingReports = data?.pendingReports ?? [];

  return (
    <div className="space-y-6">
      <div className="border-b border-sky-100 pb-5">
        <p className="mb-1 text-xs text-[#4A8CB5]">Admin</p>
        <h1 className="text-2xl font-bold text-[#062840]">IT-overblik</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#4A8CB5]">
          Kunder, åbne sager, systemfejl og rapporter der afventer afsendelse.
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#4A8CB5]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Henter overblik…
        </p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Kunne ikke indlæse IT-overblik</p>
          <p className="mt-2 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            Prøv igen
          </button>
        </div>
      ) : stats ? (
        <>
          {data?.warnings?.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Delvis data</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                {data.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <MetricPill label="Aktive kunder" value={stats.activeCustomers} />
            <MetricPill label="Systemer med fejl" value={stats.systemsWithFejl} />
            <MetricPill label="Uløste sager" value={stats.openTickets} />
            <MetricPill label="Rapporter afventer" value={stats.reportsReady} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section className="min-w-0">
              <h2 className="mb-3 text-sm font-semibold text-[#062840]">Kundeoversigt</h2>
              {customers.length === 0 ? (
                <p className="text-sm text-[#4A8CB5]">Ingen kunder endnu.</p>
              ) : (
                <ul
                  className="space-y-2 overflow-y-auto pr-1"
                  style={{ maxHeight: "calc(100vh - 200px)" }}
                >
                  {customers.map((org) => (
                    <CustomerRow key={org.id} org={org} />
                  ))}
                </ul>
              )}
            </section>

            <aside className="flex min-h-0 flex-col gap-4 lg:max-h-[calc(100vh-200px)]">
              <SidebarCard
                title="Uløste sager"
                count={openTickets.length}
                countVariant="danger"
                className="max-h-[40vh] lg:flex-[0_0_auto]"
              >
                {openTickets.length === 0 ? (
                  <p className="text-sm text-[#4A8CB5]">Ingen uløste sager</p>
                ) : (
                  <ul className="divide-y divide-sky-50">
                    {openTickets.map((t) => (
                      <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <TicketNumberBadge ticketNumber={t.ticket_number} />
                          <p className="min-w-0 flex-1 text-sm font-medium text-[#062840]">{t.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-[#4A8CB5]">{t.organisation_name}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#94a3b8]">
                            {new Date(t.created_at).toLocaleDateString("da-DK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <Link
                            href={`/admin/tickets/${t.id}`}
                            className="text-xs font-semibold text-[#0A6EBD] hover:underline"
                          >
                            Åbn →
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SidebarCard>

              <SidebarCard
                title="Systemer med fejl"
                count={systemsWithFejl.length}
                countVariant="danger"
                className="min-h-0 flex-1"
              >
                {systemsWithFejl.length === 0 ? (
                  <p className="text-sm text-[#4A8CB5]">Ingen fejl registreret</p>
                ) : (
                  <ul className="divide-y divide-sky-50">
                    {systemsWithFejl.map((s) => (
                      <li key={`${s.organisation_id}-${s.system_name}`} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-[#062840]">{s.system_name}</p>
                        <p className="mt-0.5 text-xs text-[#4A8CB5]">{s.organisation_name}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#94a3b8]">{formatCheckedAgoDa(s.checked_at)}</span>
                          <Link
                            href={`/admin/customers/${s.organisation_id}`}
                            className="text-xs font-semibold text-[#0A6EBD] hover:underline"
                          >
                            Se kunde →
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SidebarCard>

              <SidebarCard
                title="Afventer afsendelse"
                count={pendingReports.length}
                countVariant="neutral"
                className="min-h-0 flex-1"
              >
                {pendingReports.length === 0 ? (
                  <p className="text-sm text-[#4A8CB5]">Ingen rapporter afventer</p>
                ) : (
                  <ul className="divide-y divide-sky-50">
                    {pendingReports.map((r) => (
                      <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-[#062840]">{r.organisation_name}</p>
                        <p className="mt-0.5 text-xs text-[#4A8CB5]">
                          {formatReportPeriodDa(r.period_start, r.period_end)}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-[#062840]">
                            {reportStatusLabel(r.status)}
                          </span>
                          <Link
                            href={`/admin/it-rapporter/${r.id}`}
                            className="text-xs font-semibold text-[#0A6EBD] hover:underline"
                          >
                            Rediger →
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SidebarCard>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
