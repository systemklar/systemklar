"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePortalSession } from "@/components/portal/PortalLayout";
import { fetchCurrentProfile, normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import type { DailyPctOkPoint } from "@/lib/monitoring/history-daily";
import {
  formatMonitoringDetailsLines,
  monitoringCustomerExplanation,
  normalizeMonitoringStatus,
  statusBadgeClasses,
  statusBadgeLabel,
} from "@/lib/monitoring/monitoring-dashboard-copy";
import { buildOnboardingDashboardGroups, type OnboardingDashboardGroup } from "@/lib/onboarding-systems";
import { createClient } from "@/lib/supabase";
import {
  formatCheckedAgoDa,
  monitoringResultsBySystemName,
  type MonitoringResultRow,
} from "@/components/monitoring/MonitoringStatusBlock";

type PortalSystemsDashboardProps = {
  preview?: boolean;
  fullName?: string | null;
  onboardingSystemNames?: string[];
  organisationId?: string | null;
};

const FRIENDLY_SYSTEM_LABEL_DA: Record<string, string> = {
  "Hjemmeside / oppetid": "Hjemmeside",
  "SSL-certifikat": "Sikkerhedscertifikat",
  "DNS / SPF / DKIM / DMARC": "Email-sikkerhed",
  "Domæne / WHOIS": "Domæne",
  "Google PageSpeed": "Hjemmeside hastighed",
  "Have I Been Pwned (datalæk)": "Datalæk-tjek",
};

const CHART_OK = "#22c55e";
const CHART_ADVARSEL = "#f59e0b";
const CHART_FEJL = "#ef4444";
const CHART_AFVENTER = "#94a3b8";
const LINE_STATUS = "#3B9EDB";

function friendlySystemLabel(technicalName: string): string {
  const t = technicalName.trim();
  return FRIENDLY_SYSTEM_LABEL_DA[t] ?? t;
}

type FlatSystemRow = {
  key: string;
  technicalName: string;
  friendlyName: string;
};

function flattenSystems(groups: OnboardingDashboardGroup[]): FlatSystemRow[] {
  const out: FlatSystemRow[] = [];
  for (const g of groups) {
    let idx = 0;
    for (const entry of g.items) {
      const technical = entry.kind === "known" ? entry.system.name : entry.name;
      const key =
        entry.kind === "known" ? entry.system.id : `u-${g.shortLabel}-${technical}-${idx}`;
      out.push({
        key,
        technicalName: technical,
        friendlyName: friendlySystemLabel(technical),
      });
      idx += 1;
    }
  }
  return out;
}

function normalizeStatus(raw: string | undefined): "ok" | "advarsel" | "fejl" | "afventer" {
  return normalizeMonitoringStatus(raw);
}

function rowStatusText(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
  switch (status) {
    case "ok":
      return "Fungerer";
    case "advarsel":
      return "Kræver opmærksomhed";
    case "fejl":
      return "Virker ikke";
    default:
      return "Afventer opsætning";
  }
}

function dotStyle(status: "ok" | "advarsel" | "fejl" | "afventer"): { backgroundColor: string } {
  switch (status) {
    case "ok":
      return { backgroundColor: CHART_OK };
    case "advarsel":
      return { backgroundColor: CHART_ADVARSEL };
    case "fejl":
      return { backgroundColor: CHART_FEJL };
    default:
      return { backgroundColor: CHART_AFVENTER };
  }
}

type DetailSelection = {
  technical: string;
  friendly: string;
  row: MonitoringResultRow;
};

export function PortalSystemsDashboard({
  preview = false,
  onboardingSystemNames: namesProp,
  organisationId: organisationIdProp,
}: PortalSystemsDashboardProps) {
  const portalSession = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(() => !preview);
  const [resolvedOrganisationId, setResolvedOrganisationId] = useState<string | null>(null);
  const [onboardingNames, setOnboardingNames] = useState<string[]>([]);
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(() => new Map());
  const [historyDaily, setHistoryDaily] = useState<DailyPctOkPoint[]>([]);
  /** Antal kalenderdage med faktiske målinger (fra API), ikke udfyldte dage i serien. */
  const [historyDistinctDayCount, setHistoryDistinctDayCount] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [detail, setDetail] = useState<DetailSelection | null>(null);

  const orgIdForMonitoring = preview
    ? (organisationIdProp?.trim() || null)
    : (resolvedOrganisationId?.trim() || null);

  const namesLive = preview ? normalizeOnboardingSystemsFromDb(namesProp) : onboardingNames;

  useEffect(() => {
    if (preview) return;

    const userId = portalSession?.userId?.trim();
    if (!userId) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setLoading(true);
          setResolvedOrganisationId(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setResolvedOrganisationId(null);
      const profile = await fetchCurrentProfile(supabase, userId);
      if (cancelled) return;

      const orgId = profile?.organisation_id?.trim() || null;
      const orderedNames: string[] = [];
      const seen = new Set<string>();
      const pushFrom = (raw: unknown) => {
        for (const n of normalizeOnboardingSystemsFromDb(raw)) {
          if (seen.has(n)) continue;
          seen.add(n);
          orderedNames.push(n);
        }
      };

      if (orgId) {
        const { data: peers, error: peersErr } = await supabase
          .from("profiles")
          .select("onboarding_systems")
          .eq("organisation_id", orgId)
          .order("created_at", { ascending: true });
        if (cancelled) return;
        if (peersErr) {
          console.error("[PortalSystemsDashboard] profiles org union", peersErr);
          pushFrom(profile?.onboarding_systems);
        } else {
          for (const row of peers ?? []) pushFrom((row as { onboarding_systems?: unknown }).onboarding_systems);
        }
      } else {
        pushFrom(profile?.onboarding_systems);
      }

      setOnboardingNames(orderedNames);
      setResolvedOrganisationId(orgId);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [preview, supabase, portalSession?.userId]);

  useEffect(() => {
    if (!orgIdForMonitoring) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) setMonitoringByName(new Map());
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/monitoring/${encodeURIComponent(orgIdForMonitoring)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setMonitoringByName(new Map());
          return;
        }
        const data = (await res.json()) as { results?: MonitoringResultRow[] };
        if (cancelled) return;
        setMonitoringByName(monitoringResultsBySystemName(data.results ?? []));
      } catch {
        if (!cancelled) setMonitoringByName(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgIdForMonitoring]);

  useEffect(() => {
    if (!orgIdForMonitoring) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setHistoryDaily([]);
          setHistoryDistinctDayCount(null);
          setHistoryLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryDistinctDayCount(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/monitoring/${encodeURIComponent(orgIdForMonitoring)}?history=true`,
          { credentials: "include" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setHistoryDaily([]);
            setHistoryDistinctDayCount(0);
          }
          return;
        }
        const json = (await res.json()) as {
          dailyPctOk?: DailyPctOkPoint[];
          dailyHistoryDayCount?: number;
        };
        if (cancelled) return;
        const series = Array.isArray(json.dailyPctOk) ? json.dailyPctOk : [];
        setHistoryDaily(series);
        setHistoryDistinctDayCount(
          typeof json.dailyHistoryDayCount === "number" ? json.dailyHistoryDayCount : series.length,
        );
      } catch {
        if (!cancelled) {
          setHistoryDaily([]);
          setHistoryDistinctDayCount(0);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgIdForMonitoring]);

  const groups = useMemo(
    () => buildOnboardingDashboardGroups(namesLive),
    [namesLive],
  );

  const flatRows = useMemo(() => flattenSystems(groups), [groups]);

  const counts = useMemo(() => {
    let ok = 0;
    let advarsel = 0;
    let fejl = 0;
    let afventer = 0;
    for (const row of flatRows) {
      const st = normalizeStatus(monitoringByName.get(row.technicalName)?.status);
      if (st === "ok") ok += 1;
      else if (st === "advarsel") advarsel += 1;
      else if (st === "fejl") fejl += 1;
      else afventer += 1;
    }
    return { ok, advarsel, fejl, afventer, needsAttention: advarsel + fejl };
  }, [flatRows, monitoringByName]);

  const pieSlices = useMemo(
    () =>
      [
        { name: "OK", value: counts.ok, fill: CHART_OK },
        { name: "Advarsel", value: counts.advarsel, fill: CHART_ADVARSEL },
        { name: "Fejl", value: counts.fejl, fill: CHART_FEJL },
        { name: "Afventer opsætning", value: counts.afventer, fill: CHART_AFVENTER },
      ].filter((s) => s.value > 0),
    [counts],
  );

  const activeGroupKey = useMemo(() => {
    if (groups.some((g) => g.shortLabel === activeTab)) return activeTab;
    return groups[0]?.shortLabel ?? "";
  }, [groups, activeTab]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.shortLabel === activeGroupKey) ?? groups[0] ?? null,
    [groups, activeGroupKey],
  );

  const lineChartData = useMemo(
    () =>
      historyDaily.map((d) => ({
        ...d,
        label: (() => {
          const [y, m, day] = d.date.split("-").map(Number);
          const dt = new Date(y, (m ?? 1) - 1, day ?? 1);
          return dt.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
        })(),
      })),
    [historyDaily],
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  const hasSystems = flatRows.length > 0;

  const showHistorySection = !preview && hasSystems && Boolean(orgIdForMonitoring);
  const showHistoryChart =
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount >= 2 &&
    lineChartData.length >= 2;
  const showHistoryFallback =
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount < 2;

  if (loading) {
    return <p className="text-sm text-slate-500">Indlæser overblik...</p>;
  }

  return (
    <div className="space-y-8 pb-8">
      {preview ? (
        <p className="text-center text-xs text-slate-500">Forhåndsvisning af kundens portal-overblik</p>
      ) : null}

      {!hasSystems ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
          Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 border-t-4 border-t-emerald-500 bg-white px-4 pb-4 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Systemer OK</p>
                <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-slate-900">
                  {counts.ok}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 border-t-4 border-t-amber-500 bg-white px-4 pb-4 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Kræver opmærksomhed
                </p>
                <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-slate-900">
                  {counts.needsAttention}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 border-t-4 border-t-slate-300 bg-white px-4 pb-4 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Afventer opsætning
                </p>
                <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-slate-900">
                  {counts.afventer}
                </p>
              </div>
            </div>
            {!preview ? (
              <div className="shrink-0 lg:pt-0">
                <Link
                  href="/portal/support"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 lg:w-auto"
                >
                  Opret IT-sag
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-6 py-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Statusfordeling</h2>
            <div className="flex flex-wrap items-center gap-8 lg:gap-12">
              <div className="h-[180px] w-[180px] shrink-0">
                {pieSlices.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={1}
                        stroke="none"
                      >
                        {pieSlices.map((entry, index) => (
                          <Cell key={`slice-${entry.name}-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Ingen data</div>
                )}
              </div>
              <ul className="flex min-w-[10rem] flex-col gap-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_OK }} />
                  OK
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_ADVARSEL }}
                  />
                  Advarsel
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_FEJL }} />
                  Fejl
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_AFVENTER }}
                  />
                  Afventer
                </li>
              </ul>
            </div>
          </div>

          {showHistorySection ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Systemstatus de seneste 30 dage
              </h2>
              {historyLoading ? (
                <p className="text-sm text-slate-500">Indlæser historik…</p>
              ) : showHistoryChart ? (
                <div className="h-56 w-full max-w-3xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        width={44}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : Number(value) || 0}%`,
                          "Andel OK",
                        ]}
                        contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pctOk"
                        stroke={LINE_STATUS}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: LINE_STATUS }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : showHistoryFallback ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  Ikke nok data endnu — grafen vises efter første overvågningsuge
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white">
            <nav
              className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-200 px-4 pt-1 sm:px-6"
              aria-label="Systemkategorier"
            >
              {groups.map((g) => {
                const isActive = g.shortLabel === activeGroupKey;
                return (
                  <button
                    key={g.shortLabel}
                    type="button"
                    onClick={() => setActiveTab(g.shortLabel)}
                    className={`-mb-px border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-sky-600 text-slate-900"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    {g.shortLabel}
                  </button>
                );
              })}
            </nav>

            <div className="divide-y divide-slate-100">
              {activeGroup?.items.map((entry, idx) => {
                const technical = entry.kind === "known" ? entry.system.name : entry.name;
                const key =
                  entry.kind === "known" ? entry.system.id : `u-${activeGroup.shortLabel}-${technical}-${idx}`;
                const fromMap = monitoringByName.get(technical);
                const status = normalizeStatus(fromMap?.status);
                const checked =
                  fromMap?.checked_at && !Number.isNaN(new Date(fromMap.checked_at).getTime())
                    ? formatCheckedAgoDa(fromMap.checked_at)
                    : "";
                const friendly = friendlySystemLabel(technical);
                const rowForDetail: MonitoringResultRow =
                  fromMap ??
                  ({
                    system_name: technical,
                    status: "afventer",
                    checked_at: "",
                    details: {},
                  } as MonitoringResultRow);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDetail({ technical, friendly, row: rowForDetail })}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-6"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={dotStyle(status)}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{friendly}</p>
                      <p className="text-xs text-slate-500">{rowStatusText(status)}</p>
                    </div>
                    {checked ? (
                      <span className="shrink-0 text-right text-[10px] leading-tight text-slate-400">{checked}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {detail ? (
        <>
          <button
            type="button"
            aria-label="Luk panel"
            className="fixed inset-0 z-40 bg-slate-900/20"
            onClick={closeDetail}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{detail.friendly}</h2>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Luk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {(() => {
                const st = normalizeMonitoringStatus(detail.row.status);
                const expl = monitoringCustomerExplanation(detail.technical, st, detail.row.details);
                const detailLines = formatMonitoringDetailsLines(detail.row.details);
                const checkedLabel =
                  detail.row.checked_at && !Number.isNaN(new Date(detail.row.checked_at).getTime())
                    ? formatCheckedAgoDa(detail.row.checked_at)
                    : null;
                const subject = `Problem med ${detail.friendly}`;
                const supportHref = `/portal/support/new?${new URLSearchParams({ subject }).toString()}`;

                return (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                      <span
                        className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(st)}`}
                      >
                        {statusBadgeLabel(st)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{expl}</p>
                    {checkedLabel ? (
                      <p className="text-xs text-slate-400">{checkedLabel}</p>
                    ) : null}
                    {detailLines.length > 0 ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tekniske detaljer</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {detailLines.map((line, idx) => (
                            <li key={`detail-${idx}`}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="border-t border-slate-100 pt-4">
                      <Link
                        href={supportHref}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                      >
                        Opret en sag om dette
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
