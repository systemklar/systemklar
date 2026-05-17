"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronRight, X } from "lucide-react";
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
import { PortalOnboardingTour } from "@/components/portal/PortalOnboardingTour";
import {
  PortalDashboardSystemRowSkeleton,
  PortalDashboardTicketRowSkeleton,
} from "@/components/portal/PortalMonitoringSkeletons";
import { PortalSlideInPanel } from "@/components/portal/PortalOverlay";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import {
  TICKET_SELECT_BASE,
  normalizeTicketWithProfile,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { logSupabaseError } from "@/lib/supabase-error";

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

const CHART_OK = "#5A9A6A";
const CHART_ADVARSEL = "#C4A84F";
const CHART_FEJL = "#B85C4A";
const CHART_AFVENTER = "#94A3B8";
const LINE_STATUS = "#4A7FA5";
const TAB_ROTATE_MS = 8000;
const MAX_DASHBOARD_TICKETS = 3;

const ticketDateFmt = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" });

type LatestReportRow = {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
};

function reportPeriodLabel(start: string, end: string): string {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} – ${end}`;
  return `${a.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })} – ${b.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}`;
}

type HealthSparklinePoint = { date: string; pctOk: number; label: string };

function healthSparklineAxisLabel(dateKey: string): string {
  const [, m, day] = dateKey.split("-").map(Number);
  return `${day}/${m}`;
}

function buildPlaceholderHealthSparkline(): HealthSparklinePoint[] {
  const out: HealthSparklinePoint[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ date: dateKey, pctOk: 100, label: healthSparklineAxisLabel(dateKey) });
  }
  return out;
}

function buildHealthSparklineFromDaily(daily: DailyPctOkPoint[]): HealthSparklinePoint[] {
  return daily.slice(-7).map((d) => ({
    date: d.date,
    pctOk: d.pctOk,
    label: healthSparklineAxisLabel(d.date),
  }));
}

const ghostLinkClass =
  "text-sm font-medium text-[#4A7FA5] transition-colors hover:text-[#3A6F95] hover:underline";
const dashboardCardClass =
  "flex h-full min-h-0 flex-col rounded-2xl border border-[#C8D8E4] bg-white p-5 shadow-sm md:p-6";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, delayMs = 300, durationMs = 600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    setValue(0);
    let raf = 0;
    const delay = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        setValue(Math.round(easeOutCubic(p) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [target, active, delayMs, durationMs]);

  return value;
}

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
  const base = "portal-dashboard-row-dot h-2 w-2 shrink-0 rounded-full";
  if (status === "fejl") return `${base} portal-dot-fejl-anim portal-dashboard-row-dot-fejl`;
  if (status === "advarsel") return `${base} portal-dot-advarsel-anim portal-dashboard-row-dot-advarsel`;
  if (status === "ok") return `${base} portal-dashboard-row-dot-ok`;
  return `${base} portal-dot-afventer-anim portal-dashboard-row-dot-afventer`;
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
  if (status === "fejl") return "portal-attention-border-fejl bg-red-50/30";
  if (status === "advarsel") return "portal-attention-border-advarsel bg-amber-50/25";
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
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [historyDaily, setHistoryDaily] = useState<DailyPctOkPoint[]>([]);
  const [historyDistinctDayCount, setHistoryDistinctDayCount] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [tabsHovered, setTabsHovered] = useState(false);
  const [tabProgressKey, setTabProgressKey] = useState(0);
  const [tabRowGeneration, setTabRowGeneration] = useState(0);
  const [detail, setDetail] = useState<DetailSelection | null>(null);

  const tabNavRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const rotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMonitoringLoadingRef = useRef(true);
  const [chartOpen, setChartOpen] = useState(false);
  const [activeTickets, setActiveTickets] = useState<TicketWithProfileRow[]>([]);
  const [activeTicketCount, setActiveTicketCount] = useState(0);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [latestReport, setLatestReport] = useState<LatestReportRow | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const tourEligibilityCheckedRef = useRef(false);

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
        if (!cancelled) {
          setMonitoringByName(new Map());
          setMonitoringLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    setMonitoringLoading(true);
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
      } finally {
        if (!cancelled) setMonitoringLoading(false);
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

  useEffect(() => {
    if (preview || !orgIdForMonitoring) {
      setActiveTickets([]);
      setActiveTicketCount(0);
      setLatestReport(null);
      setTicketsLoading(false);
      setReportsLoading(false);
      return;
    }

    let cancelled = false;
    setTicketsLoading(true);
    setReportsLoading(true);

    void (async () => {
      const orgId = orgIdForMonitoring;

      const [ticketsRes, countRes, reportsRes] = await Promise.all([
        supabase
          .from("tickets")
          .select(TICKET_SELECT_BASE)
          .eq("organisation_id", orgId)
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(MAX_DASHBOARD_TICKETS + 1),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("organisation_id", orgId)
          .neq("status", "resolved"),
        supabase
          .from("it_reports")
          .select("id, title, period_start, period_end")
          .eq("organisation_id", orgId)
          .eq("status", "sent")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (ticketsRes.error) {
        logSupabaseError("[PortalSystemsDashboard] tickets", ticketsRes.error);
        setActiveTickets([]);
      } else {
        const rows = (ticketsRes.data ?? [])
          .map((r) => normalizeTicketWithProfile(r as unknown as Record<string, unknown>))
          .filter((x): x is TicketWithProfileRow => x !== null);
        setActiveTickets(rows.slice(0, MAX_DASHBOARD_TICKETS));
      }

      if (countRes.error) {
        logSupabaseError("[PortalSystemsDashboard] ticket count", countRes.error);
        setActiveTicketCount(0);
      } else {
        setActiveTicketCount(countRes.count ?? 0);
      }

      if (reportsRes.error) {
        logSupabaseError("[PortalSystemsDashboard] it_reports", reportsRes.error);
        setLatestReport(null);
      } else if (reportsRes.data) {
        const r = reportsRes.data as LatestReportRow;
        setLatestReport({
          id: r.id,
          title: r.title,
          period_start: r.period_start,
          period_end: r.period_end,
        });
      } else {
        setLatestReport(null);
      }

      setTicketsLoading(false);
      setReportsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgIdForMonitoring, preview, supabase]);

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

  const resetTabRotateTimer = useCallback(() => {
    setTabProgressKey((k) => k + 1);
  }, []);

  const goToTab = useCallback(
    (key: string, manual = false) => {
      if (manual) resetTabRotateTimer();
      if (key === activeTabKey) return;
      setActiveTab(key);
      setTabProgressKey((k) => k + 1);
      setTabRowGeneration((g) => g + 1);
    },
    [activeTabKey, resetTabRotateTimer],
  );

  useEffect(() => {
    if (!activeTab && defaultTabKey) {
      setActiveTab(defaultTabKey);
    }
  }, [activeTab, defaultTabKey]);

  useEffect(() => {
    if (prevMonitoringLoadingRef.current && !monitoringLoading) {
      setTabRowGeneration((g) => g + 1);
    }
    prevMonitoringLoadingRef.current = monitoringLoading;
  }, [monitoringLoading]);

  useEffect(() => {
    if (rotateTimeoutRef.current) clearTimeout(rotateTimeoutRef.current);

    if (
      tabsHovered ||
      tabsWithSystems.length <= 1 ||
      preview ||
      monitoringLoading
    ) {
      return;
    }

    rotateTimeoutRef.current = setTimeout(() => {
      const currentIndex = tabsWithSystems.findIndex((g) => g.shortLabel === activeTabKey);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tabsWithSystems.length;
      const nextKey = tabsWithSystems[nextIndex]?.shortLabel;
      if (nextKey) goToTab(nextKey, false);
    }, TAB_ROTATE_MS);

    return () => {
      if (rotateTimeoutRef.current) clearTimeout(rotateTimeoutRef.current);
    };
  }, [
    activeTabKey,
    goToTab,
    monitoringLoading,
    preview,
    tabProgressKey,
    tabsHovered,
    tabsWithSystems,
  ]);

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

  const hasEnoughHealthData =
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount >= 2 &&
    historyDaily.length >= 2;

  const healthSparklineData = useMemo(() => {
    if (hasEnoughHealthData) return buildHealthSparklineFromDaily(historyDaily);
    return buildPlaceholderHealthSparkline();
  }, [hasEnoughHealthData, historyDaily]);

  const averageUptimePct = useMemo(() => {
    if (!hasEnoughHealthData || historyDaily.length === 0) return null;
    const sum = historyDaily.reduce((acc, d) => acc + d.pctOk, 0);
    return Math.round((sum / historyDaily.length) * 10) / 10;
  }, [hasEnoughHealthData, historyDaily]);

  const hasSystems = systemRows.length > 0;
  const statsReady = hasSystems && !monitoringLoading;

  const completeOnboardingTour = useCallback(async () => {
    setTourOpen(false);
    try {
      await fetch("/api/portal/profile/onboarding-tour", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* tour stays dismissed locally */
    }
  }, []);

  useEffect(() => {
    if (preview || loading || !hasSystems || tourEligibilityCheckedRef.current) return;
    const userId = portalSession?.userId?.trim();
    if (!userId) return;

    tourEligibilityCheckedRef.current = true;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        const profile = await fetchCurrentProfile(supabase, userId);
        if (cancelled || !profile) return;
        if (profile.onboarding_completed !== true) return;
        if (profile.onboarding_tour_completed === true) return;
        setTourOpen(true);
      })();
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [preview, loading, hasSystems, portalSession?.userId, supabase]);
  const displayOk = useCountUp(counts.ok, statsReady);
  const displayAdvarsel = useCountUp(counts.advarsel + counts.fejl, statsReady);
  const displayAfventer = useCountUp(counts.afventer, statsReady);
  const showUptimeChart =
    !preview &&
    hasSystems &&
    Boolean(orgIdForMonitoring) &&
    !historyLoading &&
    historyDistinctDayCount !== null &&
    historyDistinctDayCount >= 2 &&
    lineChartData.length >= 2;

  const displayedTickets = activeTickets.slice(0, MAX_DASHBOARD_TICKETS);

  const heroSurfaceClass = heroAllOk
    ? "border border-emerald-100/80 bg-[#EDFAF5]"
    : heroHasFejl
      ? "border border-red-100/80 bg-gradient-to-r from-[#FEF2F2] to-[#FFFBFB]"
      : "border border-amber-100/80 bg-gradient-to-r from-[#FFFBEB] to-[#FFFEF7]";

  const renderMiniHero = () => {
    if (monitoringLoading) {
      return (
        <div
          className="flex max-h-[120px] items-center gap-3 rounded-xl border border-[#C8D8E4] bg-[#EAF1F7]/50 px-4 py-3"
          aria-hidden
        >
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[#EAF1F7]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-5 w-40 max-w-full animate-pulse rounded bg-[#EAF1F7]" />
            <div className="h-3 w-28 animate-pulse rounded bg-[#EAF1F7]/90" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`portal-hero-enter flex max-h-none flex-col justify-center overflow-hidden rounded-xl px-3 py-2 md:max-h-[100px] md:px-4 md:py-2.5 ${heroSurfaceClass}`}
      >
        <div className="flex items-center gap-3">
          <div className="portal-hero-icon-fade-in shrink-0" aria-hidden>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/90 ${
                heroAllOk ? "" : "portal-hero-warning-icon-glow"
              }`}
            >
              {heroAllOk ? (
                <Check className="h-6 w-6 text-[#5A9A6A]" strokeWidth={2.5} />
              ) : (
                <AlertTriangle
                  className={`h-6 w-6 ${heroHasFejl ? "text-[#B85C4A]" : "text-[#C4A84F]"}`}
                  strokeWidth={2}
                />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h1
              className={`text-lg font-semibold leading-snug tracking-tight md:text-xl ${
                heroAllOk ? "text-[#1E3448]" : "portal-hero-warning-shimmer"
              }`}
            >
              {heroAllOk
                ? "Alt fungerer"
                : counts.needsAttention === 1
                  ? "1 system kræver opmærksomhed"
                  : `${counts.needsAttention} systemer kræver opmærksomhed`}
            </h1>
            <p className="mt-0.5 text-[11px] text-[#7A9AB0]">Senest tjekket {latestCheckSubtext}</p>
          </div>
        </div>
        {!heroAllOk && attentionRows.length > 0 ? (
          <div className="mt-1.5 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {attentionRows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => openDetail(row)}
                className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium ${
                  row.status === "fejl"
                    ? "border-red-200 bg-white/90 text-[#B85C4A]"
                    : "border-amber-200 bg-white/90 text-[#C4A84F]"
                }`}
              >
                {row.friendly}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderSystemRow = (row: SystemRowModel, tabKey: string, index: number, animate: boolean) => (
    <li
      key={`${tabKey}-${tabRowGeneration}-${row.key}`}
      className={animate ? "portal-dash-row-enter" : undefined}
      style={animate ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      <button
        type="button"
        onClick={() => openDetail(row)}
        className={`group/dash-row flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-[#EAF1F7] ${rowAccentClass(row.status)}`}
      >
        <span
          className={dotClassName(row.status)}
          style={dotStyle(row.status)}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-sm font-semibold text-[#1E3448]">{row.friendly}</span>
        <span className="hidden shrink-0 text-xs font-medium text-[#4A6478] sm:block">
          {rowStatusLabel(row.status)}
        </span>
        {row.status === "afventer" ? (
          <Link
            href="/portal/systemer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-[11px] text-[#7A9AB0] hover:text-[#4A7FA5]"
          >
            Opsæt →
          </Link>
        ) : (
          <span className="hidden shrink-0 text-[10px] text-[#7A9AB0] md:inline">{row.checked}</span>
        )}
      </button>
    </li>
  );

  if (loading) {
    return <p className="text-sm text-[#7A9AB0]">Indlæser overblik...</p>;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full max-w-none flex-col md:overflow-hidden">
      {preview ? (
        <p className="mb-4 text-center text-xs text-[#7A9AB0]">
          Forhåndsvisning af kundens portal-overblik
        </p>
      ) : null}

      {!hasSystems ? (
        <div className="rounded-2xl border border-[#C8D8E4] bg-white px-6 py-10 text-center text-sm text-[#4A6478] shadow-sm">
          Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
        </div>
      ) : (
        <>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 md:gap-5 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_auto]">
          <article
            data-tour="dashboard-systemstatus"
            className={`${dashboardCardClass} min-h-0 lg:col-span-2`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7A9AB0]">
              Systemstatus
            </h2>
            <div className="mt-3 flex min-h-0 flex-1 flex-col space-y-3 md:mt-4 md:space-y-3">
              {renderMiniHero()}
              {!monitoringLoading ? (
                <p className="text-sm text-[#4A6478]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#5A9A6A]" aria-hidden />
                    <span className="font-semibold tabular-nums text-[#1E3448]">{displayOk}</span> OK
                  </span>
                  <span className="mx-2 text-[#C8D8E4]">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#C4A84F]" aria-hidden />
                    <span className="font-semibold tabular-nums text-[#1E3448]">{displayAdvarsel}</span> Advarsel
                  </span>
                  <span className="mx-2 text-[#C8D8E4]">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#94A3B8]" aria-hidden />
                    <span className="font-semibold tabular-nums text-[#1E3448]">{displayAfventer}</span> Afventer
                  </span>
                </p>
              ) : null}
              <div
                className="-mx-2 flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-[#C8D8E4] md:min-h-0"
                onMouseEnter={() => setTabsHovered(true)}
                onMouseLeave={() => setTabsHovered(false)}
              >
                <div ref={tabNavRef} data-tour="dashboard-system-tabs" className="relative border-b border-[#C8D8E4]">
                  <nav className="flex gap-0 overflow-x-auto" aria-label="Systemkategorier">
                    {tabsWithSystems.map((g) => {
                      const tabRows = rowsByGroup.get(g.shortLabel) ?? [];
                      const issueCount =
                        monitoringLoading
                          ? 0
                          : tabRows.filter(
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
                          disabled={monitoringLoading}
                          className={`relative shrink-0 overflow-hidden px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                            isActive ? "text-[#1E3448]" : "text-[#7A9AB0] hover:text-[#4A6478]"
                          }`}
                        >
                          {g.shortLabel}
                          {!monitoringLoading && issueCount > 0 ? (
                            <span
                              className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1 text-[10px] font-semibold ${
                                isActive
                                  ? "bg-[#4A7FA5] text-white"
                                  : "bg-amber-100 text-amber-800"
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
                    className="pointer-events-none absolute bottom-0 left-0 h-[2px] overflow-hidden bg-[#EAF1F7]/80 transition-[transform,width] duration-300 ease-out"
                    style={{
                      transform: `translateX(${tabIndicator.left}px)`,
                      width: tabIndicator.width,
                    }}
                    aria-hidden
                  >
                    {!monitoringLoading && !preview && tabsWithSystems.length > 1 ? (
                      <span
                        key={tabProgressKey}
                        className={`portal-tab-progress block h-full bg-[#4A7FA5] ${
                          tabsHovered ? "portal-tab-progress-paused" : ""
                        }`}
                      />
                    ) : null}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden" aria-busy={monitoringLoading}>
                  {tabsWithSystems.map((g) => {
                    const tabKey = g.shortLabel;
                    const tabRows = rowsByGroup.get(tabKey) ?? [];
                    const isActive = tabKey === activeTabKey;
                    return (
                      <ul
                        key={tabKey}
                        className={`divide-y divide-[#E0EAF0] ${isActive ? "block" : "hidden"}`}
                        aria-hidden={!isActive}
                      >
                        {monitoringLoading
                          ? tabRows.map((row) => (
                              <PortalDashboardSystemRowSkeleton key={row.key} />
                            ))
                          : tabRows.map((row, index) =>
                              renderSystemRow(row, tabKey, index, isActive),
                            )}
                      </ul>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-auto shrink-0 pt-4">
              <Link href="/portal/systemer" className={ghostLinkClass}>
                Se alle systemer →
              </Link>
            </div>
          </article>

          {!preview ? (
            <article data-tour="dashboard-active-tickets" className={`${dashboardCardClass} min-h-0`}>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#1E3448]">Aktive sager</h2>
                {!ticketsLoading ? (
                  <span className="rounded-full bg-[#EAF1F7] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#1E3448]">
                    {activeTicketCount}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 min-h-0 flex-1">
                {ticketsLoading ? (
                  <ul className="divide-y divide-[#E0EAF0]" aria-busy>
                    {[0, 1, 2].map((i) => (
                      <PortalDashboardTicketRowSkeleton key={i} />
                    ))}
                  </ul>
                ) : displayedTickets.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[#7A9AB0]">Ingen aktive sager</p>
                ) : (
                  <ul className="divide-y divide-[#E0EAF0]">
                    {displayedTickets.map((ticket) => (
                      <li key={ticket.id} className="py-3 first:pt-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <TicketNumberBadge ticketNumber={ticket.ticket_number} />
                          <p className="truncate text-sm font-semibold text-[#1E3448]">{ticket.title}</p>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-[#7A9AB0]">
                            {ticket.created_at
                              ? ticketDateFmt.format(new Date(ticket.created_at))
                              : "—"}
                          </p>
                          <StatusBadge status={ticket.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-auto space-y-3 pt-5">
                <Link
                  href="/portal/support/new"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#4A7FA5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3A6F95]"
                >
                  Opret IT-sag
                </Link>
                <Link href="/portal/support" className={`block text-center ${ghostLinkClass}`}>
                  Se alle sager →
                </Link>
              </div>
            </article>
          ) : null}

          {!preview ? (
            <div className="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-2">
              <article data-tour="dashboard-latest-report" className={dashboardCardClass}>
                <h2 className="text-sm font-semibold text-[#1E3448]">Seneste rapport</h2>
              <div className="mt-4 min-h-0 flex-1">
                {reportsLoading ? (
                  <div className="space-y-2 py-2" aria-hidden>
                    <div className="h-4 w-3/4 max-w-xs animate-pulse rounded bg-[#EAF1F7]" />
                    <div className="h-3 w-1/2 max-w-[10rem] animate-pulse rounded bg-[#EAF1F7]/90" />
                  </div>
                ) : latestReport ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#1E3448]">{latestReport.title}</p>
                    <p className="text-xs text-[#7A9AB0]">
                      {reportPeriodLabel(latestReport.period_start, latestReport.period_end)}
                    </p>
                    <Link
                      href={`/portal/rapport/${latestReport.id}`}
                      className={`inline-flex items-center gap-0.5 ${ghostLinkClass}`}
                    >
                      Se rapport →
                    </Link>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm font-medium text-[#4A6478]">Ingen rapporter endnu</p>
                    <p className="mt-1 text-xs text-[#7A9AB0]">
                      Din første rapport genereres af Systemklar
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-auto shrink-0 pt-4">
                <Link href="/portal/rapport" className={ghostLinkClass}>
                  Se alle rapporter →
                </Link>
              </div>
              </article>

              <article className={`${dashboardCardClass} min-h-0`}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7A9AB0]">
                  Systemsundhed
                </h2>
                <p className="mt-0.5 text-xs text-[#7A9AB0]">denne måned</p>
                <div className="mt-4 min-h-0 flex-1">
                  {historyLoading ? (
                    <div className="space-y-3" aria-hidden>
                      <div className="h-24 w-full animate-pulse rounded-lg bg-[#EAF1F7]" />
                      <div className="h-4 w-48 animate-pulse rounded bg-[#EAF1F7]" />
                    </div>
                  ) : (
                    <>
                      <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={healthSparklineData}
                            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="portalHealthSparkFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={LINE_STATUS} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={LINE_STATUS} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 10, fill: "#7A9AB0" }}
                              axisLine={false}
                              tickLine={false}
                              dy={4}
                              interval="preserveStartEnd"
                            />
                            <YAxis domain={[0, 100]} hide width={0} />
                            <Area
                              type="monotone"
                              dataKey="pctOk"
                              stroke={LINE_STATUS}
                              strokeWidth={2}
                              fill="url(#portalHealthSparkFill)"
                              dot={false}
                              isAnimationActive={hasEnoughHealthData}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      {!hasEnoughHealthData ? (
                        <p className="mt-2 text-center text-xs text-[#7A9AB0]">
                          Data indsamles — grafen vises snart
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  {historyLoading ? (
                    <div className="h-4 w-44 animate-pulse rounded bg-[#EAF1F7]" aria-hidden />
                  ) : averageUptimePct !== null ? (
                    <p className="text-sm text-[#4A6478]">
                      Gennemsnitlig oppetid:{" "}
                      <span className="font-bold text-[#1E3448]">{averageUptimePct}%</span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[#4A6478]">Ikke nok data endnu</p>
                  )}
                </div>
              </article>
            </div>
          ) : null}
        </div>

        {showUptimeChart ? (
          <section className="mt-4 overflow-hidden rounded-2xl border border-[#C8D8E4] bg-white shadow-sm md:hidden">
            <button
              type="button"
              onClick={() => setChartOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#EAF1F7]/60"
              aria-expanded={chartOpen}
            >
              <h2 className="text-sm font-semibold text-[#1E3448]">Oppetid de seneste 30 dage</h2>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#7A9AB0] transition-transform duration-200 ${
                  chartOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            {chartOpen ? (
              <div className="border-t border-[#E0EAF0] px-4 pb-5 pt-1">
                <div className="h-48 w-full">
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
                        tick={{ fontSize: 11, fill: "#7A9AB0" }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        width={40}
                        tick={{ fontSize: 11, fill: "#7A9AB0" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : Number(value) || 0}%`,
                          "Andel OK",
                        ]}
                        contentStyle={{
                          border: "1px solid #C8D8E4",
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
              </div>
            ) : null}
          </section>
        ) : null}
        </>
      )}

      {detail ? (
        <PortalSlideInPanel open onClose={closeDetail}>
            <div className="flex items-start justify-between gap-3 border-b border-[#C8D8E4] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#1E3448]">{detail.friendly}</h2>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-full p-1.5 text-[#7A9AB0] transition hover:bg-[#EAF1F7] hover:text-[#1E3448]"
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#7A9AB0]">
                        Status
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(st)}`}
                      >
                        {statusBadgeLabel(st)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#4A6478]">{expl}</p>
                    {checkedLabel ? (
                      <p className="text-xs text-[#7A9AB0]">{checkedLabel}</p>
                    ) : null}
                    {detailLines.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#7A9AB0]">
                          Tekniske detaljer
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-[#4A6478]">
                          {detailLines.map((line, idx) => (
                            <li key={`detail-${idx}`}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="border-t border-[#C8D8E4] pt-4">
                      <Link
                        href={supportHref}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[#4A7FA5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3A6F95]"
                      >
                        Opret en sag om dette
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
        </PortalSlideInPanel>
      ) : null}

      {!preview ? (
        <PortalOnboardingTour open={tourOpen} onComplete={() => void completeOnboardingTour()} />
      ) : null}
    </div>
  );
}
