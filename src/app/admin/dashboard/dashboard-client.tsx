"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import {
  MONITORING_STATUS_COLORS,
  MONITORING_STATUS_LABELS,
  type DashboardActivity,
  type DashboardStats,
  type DashboardTicket,
  type MonitoringCounts,
  type MonitoringStatus,
  type OrganisationDashboardRow,
} from "@/lib/admin/dashboard-data";
import { formatCheckedAgoDa } from "@/components/monitoring/MonitoringStatusBlock";
import { formatRelativeShortDa } from "@/lib/format-relative-da";

type DashboardPayload = {
  stats: DashboardStats;
  customers: OrganisationDashboardRow[];
  recentTickets: DashboardTicket[];
  activity: DashboardActivity[];
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#4A8CB5]">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums text-[#062840]">{value}</p>
    </article>
  );
}

function MonitoringBadges({ counts }: { counts: MonitoringCounts }) {
  const total = counts.ok + counts.advarsel + counts.fejl + counts.afventer;
  if (total === 0) {
    return <span className="text-xs text-[#94a3b8]">Ingen data</span>;
  }

  const items: { key: MonitoringStatus; count: number }[] = [
    { key: "fejl", count: counts.fejl },
    { key: "advarsel", count: counts.advarsel },
    { key: "ok", count: counts.ok },
    { key: "afventer", count: counts.afventer },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {items
        .filter((i) => i.count > 0)
        .map((i) => (
          <span
            key={i.key}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: MONITORING_STATUS_COLORS[i.key] }}
            title={`${MONITORING_STATUS_LABELS[i.key]}: ${i.count}`}
          >
            {i.count}
          </span>
        ))}
    </div>
  );
}

function ActivityIcon({ status }: { status: MonitoringStatus }) {
  if (status === "ok") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A7C5C]" aria-hidden />;
  }
  if (status === "fejl") {
    return <XCircle className="h-4 w-4 shrink-0 text-[#C42B2B]" aria-hidden />;
  }
  return <AlertTriangle className="h-4 w-4 shrink-0 text-[#C47B0A]" aria-hidden />;
}

function activityStatusLabel(status: MonitoringStatus): string {
  return MONITORING_STATUS_LABELS[status].toLowerCase();
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningOrgId, setRunningOrgId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      const payload = (await res.json().catch(() => ({}))) as DashboardPayload & { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Kunne ikke hente dashboard.");
        setData(null);
        return;
      }
      setData(payload);
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

  const runMonitoring = async (orgId: string, e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    if (runningOrgId) return;
    setRunningOrgId(orgId);
    try {
      const res = await fetch("/api/admin/monitoring/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId: orgId }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        console.error("[admin/dashboard] monitoring run", payload.error);
        return;
      }
      await load();
    } catch (err) {
      console.error("[admin/dashboard] monitoring run", err);
    } finally {
      setRunningOrgId(null);
    }
  };

  const stats = data?.stats;
  const customers = data?.customers ?? [];
  const recentTickets = data?.recentTickets ?? [];
  const activity = data?.activity ?? [];

  return (
    <div className="space-y-8">
      <div className="border-b border-sky-100 pb-6">
        <p className="mb-1 text-xs text-[#4A8CB5]">Admin</p>
        <h1 className="text-2xl font-bold text-[#062840]">IT-overblik</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#4A8CB5]">
          Samlet status for alle kunders systemer, sager og seneste overvågning.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#4A8CB5]">Henter overblik...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Aktive kunder" value={stats.activeCustomers} />
            <StatCard label="Systemer med fejl" value={stats.systemsWithFejl} />
            <StatCard label="Åbne sager" value={stats.openTickets} />
            <StatCard label="Rapporter klar" value={stats.reportsReady} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
            <section className="min-w-0 rounded-2xl border border-sky-100 bg-white shadow-sm">
              <div className="border-b border-sky-100 px-5 py-4">
                <h2 className="text-base font-semibold text-[#062840]">Kunde IT-status oversigt</h2>
              </div>
              {customers.length === 0 ? (
                <p className="p-6 text-sm text-[#4A8CB5]">Ingen kunder endnu.</p>
              ) : (
                <>
                <ul className="divide-y divide-sky-50 lg:hidden">
                  {customers.map((org) => {
                    const accent =
                      org.rowAccent === "fejl"
                        ? "border-l-[3px] border-l-[#C42B2B]"
                        : org.rowAccent === "advarsel"
                          ? "border-l-[3px] border-l-[#C47B0A]"
                          : "border-l-[3px] border-l-transparent";
                    return (
                      <li
                        key={org.id}
                        className={`cursor-pointer p-4 transition-colors hover:bg-[#F5FAFD] ${accent}`}
                        onClick={() => router.push(`/admin/customers/${org.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <OrganisationLogo
                            logoUrl={org.logo_url}
                            initials={initialsFromName(org.name)}
                            className="h-10 w-10 text-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#062840]">{org.name}</p>
                            <p className="mt-0.5 truncate text-xs text-[#4A8CB5]">
                              {org.domain ?? "Intet domæne"}
                            </p>
                            <div className="mt-2">
                              <MonitoringBadges counts={org.monitoring} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#4A8CB5]">
                              <span>{org.openTickets} åbne sager</span>
                              {org.lastCheckedAt ? (
                                <span>{formatRelativeShortDa(org.lastCheckedAt)}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/admin/customers/${org.id}`}
                            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-sky-100 text-xs font-semibold text-[#0A6EBD]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Se kunde
                          </Link>
                          <button
                            type="button"
                            title="Kør monitoring"
                            disabled={runningOrgId === org.id}
                            onClick={(e) => void runMonitoring(org.id, e)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-sky-100 text-[#0A6EBD] disabled:opacity-50"
                          >
                            {runningOrgId === org.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Play className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-sky-50 text-xs font-medium uppercase tracking-wide text-[#4A8CB5]">
                        <th className="px-5 py-3">Kunde</th>
                        <th className="px-3 py-3">Domæne</th>
                        <th className="px-3 py-3">Systemer</th>
                        <th className="px-3 py-3 text-center">Åbne sager</th>
                        <th className="px-3 py-3">Seneste tjek</th>
                        <th className="px-5 py-3 text-right">Handling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((org) => {
                        const accent =
                          org.rowAccent === "fejl"
                            ? "border-l-[3px] border-l-[#C42B2B]"
                            : org.rowAccent === "advarsel"
                              ? "border-l-[3px] border-l-[#C47B0A]"
                              : "border-l-[3px] border-l-transparent";
                        return (
                          <tr
                            key={org.id}
                            className={`cursor-pointer border-b border-sky-50 transition-colors hover:bg-[#F5FAFD] ${accent}`}
                            onClick={() => router.push(`/admin/customers/${org.id}`)}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <OrganisationLogo
                                  logoUrl={org.logo_url}
                                  initials={initialsFromName(org.name)}
                                  className="h-9 w-9 text-xs"
                                />
                                <span className="font-medium text-[#062840]">{org.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-[#4A8CB5]">
                              {org.domain ?? <span className="text-[#94a3b8]">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <MonitoringBadges counts={org.monitoring} />
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums text-[#062840]">
                              {org.openTickets}
                            </td>
                            <td className="px-3 py-3 text-[#4A8CB5]">
                              {org.lastCheckedAt ? (
                                <span title={formatCheckedAgoDa(org.lastCheckedAt)}>
                                  {formatRelativeShortDa(org.lastCheckedAt)}
                                </span>
                              ) : (
                                <span className="text-[#94a3b8]">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/admin/customers/${org.id}`}
                                  className="text-xs font-semibold text-[#0A6EBD] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Se kunde →
                                </Link>
                                <button
                                  type="button"
                                  title="Kør monitoring"
                                  disabled={runningOrgId === org.id}
                                  onClick={(e) => void runMonitoring(org.id, e)}
                                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-sky-100 text-[#0A6EBD] transition-colors hover:bg-[#F0F7FF] disabled:opacity-50"
                                >
                                  {runningOrgId === org.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  ) : (
                                    <Play className="h-4 w-4" aria-hidden />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </section>

            <aside className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#062840]">Aktive sager</h2>
              {recentTickets.length === 0 ? (
                <p className="mt-4 text-sm text-[#4A8CB5]">Ingen åbne sager.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {recentTickets.map((t) => (
                    <li key={t.id} className="border-b border-sky-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TicketNumberBadge ticketNumber={t.ticket_number} />
                        <p className="font-medium text-[#062840]">{t.title}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-[#4A8CB5]">{t.organisation_name}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-[#94a3b8]">{formatRelativeShortDa(t.created_at)}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-[#0A6EBD] hover:underline"
                      >
                        Åbn →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/admin/tickets"
                className="mt-5 inline-block text-sm font-semibold text-[#0A6EBD] hover:underline"
              >
                Se alle sager →
              </Link>
            </aside>
          </div>

          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#062840]">Seneste aktivitet</h2>
            <p className="mt-1 text-xs text-[#4A8CB5]">Statusændringer fra overvågning (sidste 24 timer)</p>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-[#4A8CB5]">Ingen statusændringer i den seneste periode.</p>
            ) : (
              <ul className="mt-4 divide-y divide-sky-50">
                {activity.map((ev, i) => (
                  <li key={`${ev.organisation_id}-${ev.system_name}-${ev.checked_at}-${i}`} className="flex gap-3 py-3">
                    <ActivityIcon status={ev.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#062840]">
                        <span className="font-medium">{ev.organisation_name}</span>
                        {" — "}
                        <span>{ev.system_name}</span>{" "}
                        <span className="text-[#4A8CB5]">
                          skiftede til {activityStatusLabel(ev.status)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#94a3b8]">{formatRelativeShortDa(ev.checked_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
