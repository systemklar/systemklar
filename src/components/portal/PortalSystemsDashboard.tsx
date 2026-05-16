"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Plus, X } from "lucide-react";
import {
  Area,
  AreaChart,
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

const CHART_OK = "#0A7C5C";
const CHART_ADVARSEL = "#C47B0A";
const CHART_FEJL = "#C42B2B";
const CHART_AFVENTER = "#94A3B8";
const LINE_STATUS = "#0A6EBD";

function friendlySystemLabel(technicalName: string): string {
  const t = technicalName.trim();
  return FRIENDLY_SYSTEM_LABEL_DA[t] ?? t;
}

function categoryLabelUpper(group: OnboardingDashboardGroup): string {
  const base = group.shortLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return base;
}

function normalizeStatus(raw: string | undefined): "ok" | "advarsel" | "fejl" | "afventer" {
  return normalizeMonitoringStatus(raw);
}

function rowStatusLabel(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
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

function dotClassName(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
  const base = "h-2.5 w-2.5 shrink-0 rounded-full";
  switch (status) {
    case "ok":
      return base;
    case "advarsel":
      return base;
    case "fejl":
      return `${base} portal-status-dot-fejl`;
    default:
      return base;
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

type SystemRowModel = {
  key: string;
  technical: string;
  friendly: string;
  status: "ok" | "advarsel" | "fejl" | "afventer";
  checked: string;
  rowForDetail: MonitoringResultRow;
  groupShortLabel: string;
};

function buildSystemRows(
  groups: OnboardingDashboardGroup[],
  monitoringByName: Map<string, MonitoringResultRow>,
): SystemRowModel[] {
  const rows: SystemRowModel[] = [];
  for (const group of groups) {
    let idx = 0;
    for (const entry of group.items) {
      const technical = entry.kind === "known" ? entry.system.name : entry.name;
      const key =
        entry.kind === "known" ? entry.system.id : `u-${group.shortLabel}-${technical}-${idx}`;
      const fromMap = monitoringByName.get(technical);
      const status = normalizeStatus(fromMap?.status);
      const checked =
        fromMap?.checked_at && !Number.isNaN(new Date(fromMap.checked_at).getTime())
          ? formatCheckedAgoDa(fromMap.checked_at)
          : "";
      rows.push({
        key,
        technical,
        friendly: friendlySystemLabel(technical),
        status,
        checked,
        groupShortLabel: group.shortLabel,
        rowForDetail:
          fromMap ??
          ({
            system_name: technical,
            status: "afventer",
            checked_at: "",
            details: {},
          } as MonitoringResultRow),
      });
      idx += 1;
    }
  }
  return rows;
}

function mostRecentCheckIso(monitoringByName: Map<string, MonitoringResultRow>): string | null {
  let latest: number | null = null;
  for (const row of monitoringByName.values()) {
    const t = new Date(row.checked_at).getTime();
    if (Number.isNaN(t)) continue;
    if (latest === null || t > latest) latest = t;
  }
  return latest !== null ? new Date(latest).toISOString() : null;
}

function shortCheckedAgo(iso: string | null): string {
  if (!iso) return "endnu ikke tjekket";
  const full = formatCheckedAgoDa(iso);
  return full.replace(/^Tjekket\s*/i, "").trim() || full;
}

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
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(
    () => new Map(),
  );
  const [historyDaily, setHistoryDaily] = useState<DailyPctOkPoint[]>([]);
  const [historyDistinctDayCount, setHistoryDistinctDayCount] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
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
          for (const row of peers ?? []) {
            pushFrom((row as { onboarding_systems?: unknown }).onboarding_systems);
          }
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

  const groups = useMemo(() => buildOnboardingDashboardGroups(namesLive), [namesLive]);

  const systemRows = useMemo(
    () => buildSystemRows(groups, monitoringByName),
    [groups, monitoringByName],
  );

  const counts = useMemo(() => {
    let ok = 0;
    let advarsel = 0;
    let fejl = 0;
    let afventer = 0;
    for (const row of systemRows) {
      if (row.status === "ok") ok += 1;
      else if (row.status === "advarsel") advarsel += 1;
      else if (row.status === "fejl") fejl += 1;
      else afventer += 1;
    }
    return { ok, advarsel, fejl, afventer, needsAttention: advarsel + fejl };
  }, [systemRows]);

  const attentionNames = useMemo(
    () =>
      systemRows
        .filter((r) => r.status === "advarsel" || r.status === "fejl")
        .map((r) => r.friendly),
    [systemRows],
  );

  const heroAllOk = counts.needsAttention === 0 && systemRows.length > 0;
  const heroHasFejl = counts.fejl > 0;
  const latestCheckIso = useMemo(() => mostRecentCheckIso(monitoringByName), [monitoringByName]);
  const latestCheckSubtext = shortCheckedAgo(latestCheckIso);

  const lineChartData = useMemo(
    () =>
      historyDaily.map((d) => {
        const [y, m, day] = d.date.split("-").map(Number);
        const dt = new Date(y, (m ?? 1) - 1, day ?? 1);
        return {
          ...d,
          label: dt.toLocaleDateString("da-DK", { day: "numeric", month: "short" }),
        };
      }),
    [historyDaily],
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  const hasSystems = systemRows.length > 0;
  const showHistorySection = !preview && hasSystems && Boolean(orgIdForMonitoring);
  const showHistoryChart =
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount >= 2 &&
    lineChartData.length >= 2;
  const showHistoryFallback =
    !historyLoading && historyDistinctDayCount !== null && historyDistinctDayCount < 2;

  const rowsByGroup = useMemo(() => {
    const map = new Map<string, (SystemRowModel & { animIndex: number })[]>();
    let index = 0;
    for (const row of systemRows) {
      const list = map.get(row.groupShortLabel) ?? [];
      list.push({ ...row, animIndex: index });
      map.set(row.groupShortLabel, list);
      index += 1;
    }
    return map;
  }, [systemRows]);

  if (loading) {
    return <p className="text-sm text-[#7AAEC8]">Indlæser overblik...</p>;
  }

  return (
    <div className="relative pb-28">
      {preview ? (
        <p className="mb-6 text-center text-xs text-[#7AAEC8]">Forhåndsvisning af kundens portal-overblik</p>
      ) : null}

      {!hasSystems ? (
        <div className="rounded-2xl border border-sky-100 bg-white px-6 py-12 text-center text-sm text-[#2C4A5E] shadow-sm">
          Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero status banner */}
          <section
            className={`rounded-2xl px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12 ${
              heroAllOk
                ? "border border-emerald-100/80 bg-gradient-to-b from-[#EDFAF5] to-[#F5FFFB]"
                : heroHasFejl
                  ? "border border-red-100/80 bg-gradient-to-b from-[#FEF2F2] to-[#FFFBFB]"
                  : "border border-amber-100/80 bg-gradient-to-b from-[#FFFBEB] to-[#FFFEF7]"
            }`}
          >
            <div className="mx-auto flex max-w-lg flex-col items-center">
              {heroAllOk ? (
                <div
                  className="portal-hero-icon-pulse mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm"
                  aria-hidden
                >
                  <Check className="h-8 w-8 text-[#0A7C5C]" strokeWidth={2.5} />
                </div>
              ) : (
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm"
                  aria-hidden
                >
                  <AlertTriangle
                    className={`h-8 w-8 ${heroHasFejl ? "text-[#C42B2B]" : "text-[#C47B0A]"}`}
                    strokeWidth={2}
                  />
                </div>
              )}

              {heroAllOk ? (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#0D1F2D] sm:text-3xl">
                    Alt fungerer som det skal
                  </h1>
                  <p className="mt-2 text-sm text-[#7AAEC8]">
                    Senest tjekket {latestCheckSubtext}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#0D1F2D] sm:text-3xl">
                    {counts.needsAttention === 1
                      ? "1 ting kræver din opmærksomhed"
                      : `${counts.needsAttention} ting kræver din opmærksomhed`}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-[#2C4A5E]">
                    {attentionNames.slice(0, 4).join(", ")}
                    {attentionNames.length > 4
                      ? ` og ${attentionNames.length - 4} mere`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-[#7AAEC8]">
                    Senest tjekket {latestCheckSubtext}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Metric pills */}
          <div className="flex flex-wrap items-center justify-center gap-0 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm sm:px-6">
            <MetricPill label="OK" count={counts.ok} dotColor={CHART_OK} />
            <span className="hidden h-4 w-px bg-sky-100 sm:block" aria-hidden />
            <MetricPill
              label="Advarsel"
              count={counts.advarsel + counts.fejl}
              dotColor={CHART_ADVARSEL}
            />
            <span className="hidden h-4 w-px bg-sky-100 sm:block" aria-hidden />
            <MetricPill label="Afventer" count={counts.afventer} dotColor={CHART_AFVENTER} />
          </div>

          {/* System list */}
          <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            {groups.map((group) => {
              const groupRows = rowsByGroup.get(group.shortLabel) ?? [];
              if (groupRows.length === 0) return null;

              return (
                <div key={group.shortLabel}>
                  <p className="border-b border-sky-50 bg-[#FAFCFE] px-4 py-2.5 text-[10px] font-semibold tracking-[0.14em] text-[#7AAEC8] sm:px-6">
                    {categoryLabelUpper(group)}
                  </p>
                  <ul className="divide-y divide-sky-50">
                    {groupRows.map((row) => (
                        <li key={row.key}>
                          <button
                            type="button"
                            onClick={() =>
                              setDetail({
                                technical: row.technical,
                                friendly: row.friendly,
                                row: row.rowForDetail,
                              })
                            }
                            className="portal-dashboard-row-in flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-sky-50 sm:px-6"
                            style={{ animationDelay: `${row.animIndex * 50}ms` }}
                          >
                            <span
                              className={dotClassName(row.status)}
                              style={dotStyle(row.status)}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#0D1F2D]">
                              {row.friendly}
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                              <span className="text-sm font-medium text-[#2C4A5E]">
                                {rowStatusLabel(row.status)}
                              </span>
                              {row.status === "afventer" ? (
                                <Link
                                  href="/portal/systemer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-[#7AAEC8] transition-colors hover:text-[#0A6EBD]"
                                >
                                  Opsæt →
                                </Link>
                              ) : row.checked ? (
                                <span className="text-[11px] leading-tight text-[#7AAEC8]">
                                  {row.checked}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          {/* Uptime chart */}
          {showHistorySection ? (
            <section className="rounded-2xl border border-sky-100 bg-white px-6 py-6 shadow-sm">
              <h2 className="text-base font-semibold text-[#0D1F2D]">Oppetid de seneste 30 dage</h2>
              {historyLoading ? (
                <p className="mt-4 text-sm text-[#7AAEC8]">Indlæser historik…</p>
              ) : showHistoryChart ? (
                <div className="mt-6 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="portalUptimeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={LINE_STATUS} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={LINE_STATUS} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#7AAEC8" }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        width={40}
                        tick={{ fontSize: 11, fill: "#7AAEC8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : Number(value) || 0}%`,
                          "Andel OK",
                        ]}
                        contentStyle={{
                          border: "1px solid #D0E8F5",
                          borderRadius: "12px",
                          fontSize: "13px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pctOk"
                        stroke={LINE_STATUS}
                        strokeWidth={2.5}
                        fill="url(#portalUptimeFill)"
                        dot={false}
                        activeDot={{ r: 4, fill: LINE_STATUS, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : showHistoryFallback ? (
                <p className="mt-4 text-sm leading-relaxed text-[#2C4A5E]">
                  Ikke nok data endnu — grafen vises efter første overvågningsuge
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      {/* Detail slide-in */}
      {detail ? (
        <>
          <button
            type="button"
            aria-label="Luk panel"
            className="fixed inset-0 z-40 bg-[#062840]/20 backdrop-blur-[1px]"
            onClick={closeDetail}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-sky-100 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-sky-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-[#0D1F2D]">{detail.friendly}</h2>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-full p-1.5 text-[#7AAEC8] transition hover:bg-sky-50 hover:text-[#0D1F2D]"
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">
                        Status
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(st)}`}
                      >
                        {statusBadgeLabel(st)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#2C4A5E]">{expl}</p>
                    {checkedLabel ? (
                      <p className="text-xs text-[#7AAEC8]">{checkedLabel}</p>
                    ) : null}
                    {detailLines.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">
                          Tekniske detaljer
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-[#2C4A5E]">
                          {detailLines.map((line, idx) => (
                            <li key={`detail-${idx}`}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="border-t border-sky-100 pt-4">
                      <Link
                        href={supportHref}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0859A0]"
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

      {/* FAB */}
      {!preview ? (
        <Link
          href="/portal/support"
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[#062840] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0D1F2D] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A6EBD] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Opret IT-sag
        </Link>
      ) : null}
    </div>
  );
}

function MetricPill({
  label,
  count,
  dotColor,
}: {
  label: string;
  count: number;
  dotColor: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 px-3 py-1.5 text-sm text-[#2C4A5E] sm:flex-none sm:px-5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden
      />
      <span className="font-medium text-[#0D1F2D]">{count}</span>
      <span className="text-[#7AAEC8]">{label}</span>
    </div>
  );
}
