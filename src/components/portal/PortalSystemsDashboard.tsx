"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
const TAB_ROTATE_MS = 5000;

function friendlySystemLabel(technicalName: string): string {
  const t = technicalName.trim();
  return FRIENDLY_SYSTEM_LABEL_DA[t] ?? t;
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
  const base = "h-2 w-2 shrink-0 rounded-full";
  if (status === "fejl") return `${base} portal-status-dot-fejl`;
  return base;
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

function rowAccentClass(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
  if (status === "fejl") return "border-l-[3px] border-l-[#C42B2B] bg-red-50/40";
  if (status === "advarsel") return "border-l-[3px] border-l-[#C47B0A] bg-amber-50/35";
  return "border-l-[3px] border-l-transparent";
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

function groupIssueScore(rows: SystemRowModel[]): number {
  let score = 0;
  for (const row of rows) {
    if (row.status === "fejl") score += 2;
    else if (row.status === "advarsel") score += 1;
  }
  return score;
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
  const [activeTab, setActiveTab] = useState<string>("");
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true);
  const [tabsHovered, setTabsHovered] = useState(false);
  const [tabListVisible, setTabListVisible] = useState(true);
  const [detail, setDetail] = useState<DetailSelection | null>(null);

  const tabNavRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const tabSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orgIdForMonitoring = preview
    ? (organisationIdProp?.trim() || null)
    : (resolvedOrganisationId?.trim() || null);

  const namesLive = preview ? normalizeOnboardingSystemsFromDb(namesProp) : onboardingNames;

  const openDetail = useCallback((row: SystemRowModel) => {
    setDetail({
      technical: row.technical,
      friendly: row.friendly,
      row: row.rowForDetail,
    });
  }, []);

  const closeDetail = useCallback(() => setDetail(null), []);

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

  const rowsByGroup = useMemo(() => {
    const map = new Map<string, SystemRowModel[]>();
    for (const row of systemRows) {
      const list = map.get(row.groupShortLabel) ?? [];
      list.push(row);
      map.set(row.groupShortLabel, list);
    }
    return map;
  }, [systemRows]);

  const tabsWithSystems = useMemo(
    () => groups.filter((g) => (rowsByGroup.get(g.shortLabel) ?? []).length > 0),
    [groups, rowsByGroup],
  );

  const defaultTabKey = useMemo(() => {
    let best = tabsWithSystems[0]?.shortLabel ?? "";
    let bestScore = -1;
    for (const g of tabsWithSystems) {
      const score = groupIssueScore(rowsByGroup.get(g.shortLabel) ?? []);
      if (score > bestScore) {
        bestScore = score;
        best = g.shortLabel;
      }
    }
    return best;
  }, [tabsWithSystems, rowsByGroup]);

  const activeTabKey = useMemo(() => {
    if (tabsWithSystems.some((g) => g.shortLabel === activeTab)) return activeTab;
    return defaultTabKey;
  }, [activeTab, defaultTabKey, tabsWithSystems]);

  const activeTabRows = rowsByGroup.get(activeTabKey) ?? [];

  const updateTabIndicator = useCallback(() => {
    const nav = tabNavRef.current;
    const btn = tabButtonRefs.current.get(activeTabKey);
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setTabIndicator({
      left: btnRect.left - navRect.left + nav.scrollLeft,
      width: btnRect.width,
    });
  }, [activeTabKey]);

  useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator, tabsWithSystems, activeTabKey]);

  useEffect(() => {
    const nav = tabNavRef.current;
    if (!nav) return;
    const onResize = () => updateTabIndicator();
    nav.addEventListener("scroll", onResize);
    window.addEventListener("resize", onResize);
    return () => {
      nav.removeEventListener("scroll", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, [updateTabIndicator]);

  const goToTab = useCallback(
    (key: string, manual = false) => {
      if (manual) setAutoRotateEnabled(false);
      if (key === activeTabKey) return;

      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);

      setTabListVisible(false);
      tabSwitchTimeoutRef.current = setTimeout(() => {
        setActiveTab(key);
        setTabListVisible(true);
        tabSwitchTimeoutRef.current = null;
      }, 150);
    },
    [activeTabKey],
  );

  useEffect(() => {
    if (!activeTab && defaultTabKey) {
      setActiveTab(defaultTabKey);
    }
  }, [activeTab, defaultTabKey]);

  useEffect(() => {
    return () => {
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoRotateEnabled || tabsHovered || tabsWithSystems.length <= 1 || preview) {
      return;
    }

    const id = window.setInterval(() => {
      const currentIndex = tabsWithSystems.findIndex((g) => g.shortLabel === activeTabKey);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tabsWithSystems.length;
      const nextKey = tabsWithSystems[nextIndex]?.shortLabel;
      if (nextKey) goToTab(nextKey, false);
    }, TAB_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [activeTabKey, autoRotateEnabled, goToTab, preview, tabsHovered, tabsWithSystems]);

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

  const attentionRows = useMemo(
    () => systemRows.filter((r) => r.status === "advarsel" || r.status === "fejl"),
    [systemRows],
  );

  const heroAllOk = counts.needsAttention === 0 && systemRows.length > 0;
  const heroHasFejl = counts.fejl > 0;
  const latestCheckSubtext = shortCheckedAgo(mostRecentCheckIso(monitoringByName));

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

  const hasSystems = systemRows.length > 0;
  const showUptimeChart =
    !preview &&
    hasSystems &&
    Boolean(orgIdForMonitoring) &&
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount >= 2 &&
    lineChartData.length >= 2;

  if (loading) {
    return <p className="text-sm text-[#7AAEC8]">Indlæser overblik...</p>;
  }

  return (
    <div className="relative mx-auto max-w-3xl pb-24">
      {preview ? (
        <p className="mb-4 text-center text-xs text-[#7AAEC8]">
          Forhåndsvisning af kundens portal-overblik
        </p>
      ) : null}

      {!hasSystems ? (
        <div className="rounded-2xl border border-sky-100 bg-white px-6 py-10 text-center text-sm text-[#2C4A5E] shadow-sm">
          Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 1. Hero status */}
          <section
            className={`flex min-h-[240px] flex-col items-center justify-center rounded-2xl px-6 py-10 text-center shadow-sm ${
              heroAllOk
                ? "border border-emerald-100/80 bg-[#EDFAF5]"
                : heroHasFejl
                  ? "border border-red-100/80 bg-gradient-to-b from-[#FEF2F2] to-[#FFFBFB]"
                  : "border border-amber-100/80 bg-gradient-to-b from-[#FFFBEB] to-[#FFFEF7]"
            }`}
          >
            {heroAllOk ? (
              <>
                <div
                  className="portal-hero-icon-pulse mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-sm"
                  aria-hidden
                >
                  <Check className="h-9 w-9 text-[#0A7C5C]" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-[#0D1F2D]">Alt fungerer</h1>
                <p className="mt-1.5 text-sm text-[#7AAEC8]">
                  Senest tjekket {latestCheckSubtext}
                </p>
              </>
            ) : (
              <>
                <div
                  className="portal-hero-icon-pulse mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-sm"
                  aria-hidden
                >
                  <AlertTriangle
                    className={`h-8 w-8 ${heroHasFejl ? "text-[#C42B2B]" : "text-[#C47B0A]"}`}
                    strokeWidth={2}
                  />
                </div>
                <h1 className="text-2xl font-light tracking-tight text-[#0D1F2D] sm:text-3xl">
                  {counts.needsAttention === 1
                    ? "1 system kræver opmærksomhed"
                    : `${counts.needsAttention} systemer kræver opmærksomhed`}
                </h1>
                <p className="mt-1 text-xs text-[#7AAEC8]">Senest tjekket {latestCheckSubtext}</p>
                {attentionRows.length > 0 ? (
                  <div className="mt-3 flex max-w-lg flex-wrap justify-center gap-2">
                    {attentionRows.map((row) => (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => openDetail(row)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition hover:shadow-sm ${
                          row.status === "fejl"
                            ? "border-red-200 bg-white/90 text-[#C42B2B] hover:bg-red-50"
                            : "border-amber-200 bg-white/90 text-[#C47B0A] hover:bg-amber-50"
                        }`}
                      >
                        {row.friendly}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* 2. Stat pills */}
          <p className="text-center text-sm text-[#2C4A5E]">
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px]" aria-hidden>
                🟢
              </span>
              <span className="font-semibold tabular-nums text-[#0D1F2D]">{counts.ok}</span> OK
            </span>
            <span className="mx-2 text-[#D0E8F5]">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px]" aria-hidden>
                🟡
              </span>
              <span className="font-semibold tabular-nums text-[#0D1F2D]">
                {counts.advarsel + counts.fejl}
              </span>{" "}
              Advarsel
            </span>
            <span className="mx-2 text-[#D0E8F5]">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px]" aria-hidden>
                ⚪
              </span>
              <span className="font-semibold tabular-nums text-[#0D1F2D]">{counts.afventer}</span>{" "}
              Afventer
            </span>
          </p>

          {/* 3. Tabbed system list */}
          <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div
              ref={tabNavRef}
              className="relative border-b border-sky-100"
              onMouseEnter={() => setTabsHovered(true)}
              onMouseLeave={() => setTabsHovered(false)}
            >
              <nav
                className="flex gap-0 overflow-x-auto"
                aria-label="Systemkategorier"
              >
                {tabsWithSystems.map((g) => {
                  const tabRows = rowsByGroup.get(g.shortLabel) ?? [];
                  const issueCount = tabRows.filter(
                    (r) => r.status === "fejl" || r.status === "advarsel",
                  ).length;
                  const isActive = g.shortLabel === activeTabKey;
                  return (
                    <button
                      key={g.shortLabel}
                      ref={(el) => {
                        if (el) tabButtonRefs.current.set(g.shortLabel, el);
                        else tabButtonRefs.current.delete(g.shortLabel);
                      }}
                      type="button"
                      onClick={() => goToTab(g.shortLabel, true)}
                      className={`relative shrink-0 px-4 py-3.5 text-sm font-medium transition-colors duration-150 ${
                        isActive ? "text-[#0D1F2D]" : "text-[#7AAEC8] hover:text-[#2C4A5E]"
                      }`}
                    >
                      {g.shortLabel}
                      {issueCount > 0 ? (
                        <span
                          className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1 text-[10px] font-semibold ${
                            isActive ? "bg-[#0A6EBD] text-white" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {issueCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <span
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#0A6EBD] transition-[transform,width] duration-300 ease-out"
                style={{
                  transform: `translateX(${tabIndicator.left}px)`,
                  width: tabIndicator.width,
                }}
                aria-hidden
              />
            </div>

            <ul
              key={activeTabKey}
              className={`divide-y divide-sky-50 transition-opacity duration-150 ease-out ${
                tabListVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {activeTabRows.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => openDetail(row)}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-sky-50/80 ${rowAccentClass(row.status)}`}
                  >
                    <span
                      className={dotClassName(row.status)}
                      style={dotStyle(row.status)}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[#0D1F2D]">
                      {row.friendly}
                    </span>
                    <span className="hidden shrink-0 text-xs font-medium text-[#2C4A5E] sm:block">
                      {rowStatusLabel(row.status)}
                    </span>
                    {row.status === "afventer" ? (
                      <Link
                        href="/portal/systemer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-[11px] text-[#7AAEC8] hover:text-[#0A6EBD]"
                      >
                        Opsæt →
                      </Link>
                    ) : (
                      <span className="shrink-0 text-[10px] text-[#7AAEC8]">
                        {row.checked}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Uptime chart (only when enough data) */}
          {showUptimeChart ? (
            <section className="rounded-2xl border border-sky-100 bg-white px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#0D1F2D]">Oppetid de seneste 30 dage</h2>
              <div className="mt-4 h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={lineChartData}
                          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                        >
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
            </section>
          ) : null}
        </div>
      )}

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

      {!preview ? (
        <Link
          href="/portal/support"
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-[#062840] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0D1F2D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A6EBD] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Opret IT-sag
        </Link>
      ) : null}
    </div>
  );
}
