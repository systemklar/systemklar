import { NextResponse } from "next/server";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  countsFromLatestBySystem,
  emptyMonitoringCounts,
  normalizeMonitoringStatus,
  rowAccentFromCounts,
  worstRankFromCounts,
  type DashboardPendingReport,
  type DashboardStats,
  type DashboardSystemError,
  type DashboardTicket,
  type OrganisationDashboardRow,
} from "@/lib/admin/dashboard-data";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const MONITORING_LOOKBACK_DAYS = 45;

function emptyStats(): DashboardStats {
  return {
    activeCustomers: 0,
    systemsWithFejl: 0,
    openTickets: 0,
    reportsReady: 0,
  };
}

function formatQueryError(scope: string, error: PostgrestError): string {
  const parts = [error.message, error.details, error.hint, error.code ? `(${error.code})` : ""]
    .filter(Boolean)
    .join(" — ");
  return `${scope}: ${parts || "Ukendt databasefejl"}`;
}

function logQueryFail(scope: string, error: PostgrestError) {
  console.error(`[api/admin/dashboard] query:fail ${scope}`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

type MonitoringResultDbRow = {
  organisation_id: string;
  system_name: string;
  status: string;
  checked_at: string;
};

type LatestMonitoringPerSystem = {
  system_name: string;
  status: string;
  checked_at: string;
};

/**
 * Seneste række pr. (organisation_id, system_name) fra monitoring_results.
 * Rækker forventes sorteret checked_at desc fra Supabase; vi tager første per nøgle.
 */
function groupLatestMonitoringByOrg(
  rows: MonitoringResultDbRow[],
): Map<string, Map<string, LatestMonitoringPerSystem>> {
  const byOrg = new Map<string, LatestMonitoringPerSystem[]>();

  for (const row of rows) {
    const list = byOrg.get(row.organisation_id) ?? [];
    list.push({
      system_name: row.system_name,
      status: row.status,
      checked_at: row.checked_at,
    });
    byOrg.set(row.organisation_id, list);
  }

  const result = new Map<string, Map<string, LatestMonitoringPerSystem>>();

  for (const [orgId, list] of byOrg) {
    const sorted = [...list].sort(
      (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
    );
    const bySystem = new Map<string, LatestMonitoringPerSystem>();
    for (const r of sorted) {
      if (!bySystem.has(r.system_name)) {
        bySystem.set(r.system_name, r);
      }
    }
    result.set(orgId, bySystem);
  }

  return result;
}

async function fetchOpenTickets(admin: SupabaseClient, warnings: string[]) {
  console.log("[api/admin/dashboard] query:start tickets (åbne, liste)");
  const primary = await admin
    .from("tickets")
    .select("id, ticket_number, title, status, created_at, organisation_id")
    .neq("status", "resolved")
    .order("created_at", { ascending: true });

  if (!primary.error) {
    console.log("[api/admin/dashboard] query:ok tickets (åbne, liste)", primary.data?.length ?? 0);
    return primary.data ?? [];
  }

  logQueryFail("tickets (åbne, liste)", primary.error);
  const msg = primary.error.message ?? "";
  if (msg.includes("ticket_number") || primary.error.code === "42703") {
    console.log("[api/admin/dashboard] query:retry tickets (åbne) uden ticket_number");
    const fallback = await admin
      .from("tickets")
      .select("id, title, status, created_at, organisation_id")
      .neq("status", "resolved")
      .order("created_at", { ascending: true });
    if (fallback.error) {
      logQueryFail("tickets (åbne) fallback", fallback.error);
      warnings.push(formatQueryError("tickets (åbne)", fallback.error));
      return [];
    }
    console.log("[api/admin/dashboard] query:ok tickets (åbne) fallback", fallback.data?.length ?? 0);
    warnings.push(
      "ticket_number-kolonnen findes ikke endnu — kør migration 032_ticket_numbers.sql.",
    );
    return fallback.data ?? [];
  }

  warnings.push(formatQueryError("tickets (åbne)", primary.error));
  return [];
}

function buildSystemsWithFejl(
  latestByOrg: Map<string, Map<string, LatestMonitoringPerSystem>>,
  orgNames: Map<string, string>,
): DashboardSystemError[] {
  const out: DashboardSystemError[] = [];
  for (const [orgId, bySystem] of latestByOrg) {
    for (const row of bySystem.values()) {
      if (normalizeMonitoringStatus(row.status) !== "fejl") continue;
      out.push({
        organisation_id: orgId,
        organisation_name: orgNames.get(orgId) ?? "Ukendt",
        system_name: row.system_name,
        checked_at: row.checked_at,
      });
    }
  }
  out.sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
  return out;
}

export async function GET() {
  const warnings: string[] = [];

  try {
    console.log("[api/admin/dashboard] GET start");

    const auth = await requireAdminSession();
    if (!auth.ok) {
      console.log("[api/admin/dashboard] auth denied");
      return auth.response;
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      const msg =
        "SUPABASE_SERVICE_ROLE_KEY mangler i miljøvariabler (fx Netlify) — admin-overblik kan ikke hente data.";
      console.error("[api/admin/dashboard]", msg);
      warnings.push(msg);
      return NextResponse.json({
        stats: emptyStats(),
        customers: [],
        openTickets: [],
        systemsWithFejl: [],
        pendingReports: [],
        warnings,
      });
    }

    const monitoringSince = new Date(
      Date.now() - MONITORING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    console.log("[api/admin/dashboard] query:start organisations");
    const orgsRes = await admin
      .from("organisations")
      .select("id, name, domain, logo_url")
      .order("name", { ascending: true });

    let organisations: { id: string; name: string; domain: string | null; logo_url: string | null }[] =
      [];
    if (orgsRes.error) {
      logQueryFail("organisations", orgsRes.error);
      warnings.push(formatQueryError("organisations", orgsRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok organisations", orgsRes.data?.length ?? 0);
      organisations = orgsRes.data ?? [];
    }

    const orgNames = new Map(organisations.map((o) => [o.id, o.name]));

    console.log("[api/admin/dashboard] query:start monitoring_results");
    const monitoringRes = await admin
      .from("monitoring_results")
      .select("organisation_id, system_name, status, checked_at")
      .gte("checked_at", monitoringSince)
      .order("checked_at", { ascending: false });

    const monitoringRows: MonitoringResultDbRow[] = monitoringRes.error
      ? []
      : ((monitoringRes.data ?? []) as MonitoringResultDbRow[]);
    if (monitoringRes.error) {
      logQueryFail("monitoring_results", monitoringRes.error);
      warnings.push(formatQueryError("monitoring_results", monitoringRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok monitoring_results", monitoringRows.length);
    }

    const openTicketRows = await fetchOpenTickets(admin, warnings);

    const openTicketCountByOrg = new Map<string, number>();
    for (const t of openTicketRows) {
      const orgId = (t as { organisation_id: string }).organisation_id;
      openTicketCountByOrg.set(orgId, (openTicketCountByOrg.get(orgId) ?? 0) + 1);
    }

    console.log("[api/admin/dashboard] query:start it_reports (afventer)");
    const pendingReportsRes = await admin
      .from("it_reports")
      .select("id, organisation_id, period_start, period_end, status")
      .in("status", ["draft", "approved"])
      .order("updated_at", { ascending: false });

    let pendingReportRows: {
      id: string;
      organisation_id: string;
      period_start: string;
      period_end: string;
      status: string;
    }[] = [];
    if (pendingReportsRes.error) {
      logQueryFail("it_reports (afventer)", pendingReportsRes.error);
      warnings.push(formatQueryError("it_reports (afventer)", pendingReportsRes.error));
    } else {
      pendingReportRows = pendingReportsRes.data ?? [];
      console.log("[api/admin/dashboard] query:ok it_reports (afventer)", pendingReportRows.length);
    }

    console.log("[api/admin/dashboard] query:start profiles");
    const profilesRes = await admin
      .from("profiles")
      .select("organisation_id")
      .not("organisation_id", "is", null);

    const activeOrgIds = new Set<string>();
    if (profilesRes.error) {
      logQueryFail("profiles", profilesRes.error);
      warnings.push(formatQueryError("profiles", profilesRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok profiles", profilesRes.data?.length ?? 0);
      for (const p of profilesRes.data ?? []) {
        activeOrgIds.add((p as { organisation_id: string }).organisation_id);
      }
    }

    const latestByOrg = groupLatestMonitoringByOrg(monitoringRows);

    let systemsWithFejl = 0;
    for (const latest of latestByOrg.values()) {
      for (const row of latest.values()) {
        if (row.status === "fejl") systemsWithFejl += 1;
      }
    }

    const stats: DashboardStats = {
      activeCustomers: activeOrgIds.size,
      systemsWithFejl,
      openTickets: openTicketRows.length,
      reportsReady: pendingReportRows.length,
    };

    const customers: OrganisationDashboardRow[] = organisations.map((org) => {
      const latest = latestByOrg.get(org.id) ?? new Map();
      const monitoring = countsFromLatestBySystem(latest);
      let lastCheckedAt: string | null = null;
      for (const row of latest.values()) {
        if (!lastCheckedAt || new Date(row.checked_at).getTime() > new Date(lastCheckedAt).getTime()) {
          lastCheckedAt = row.checked_at;
        }
      }
      return {
        id: org.id,
        name: org.name,
        domain: org.domain,
        logo_url: org.logo_url,
        monitoring: latest.size === 0 ? emptyMonitoringCounts() : monitoring,
        openTickets: openTicketCountByOrg.get(org.id) ?? 0,
        lastCheckedAt,
        worstRank: worstRankFromCounts(monitoring),
        rowAccent: rowAccentFromCounts(monitoring),
      };
    });

    customers.sort((a, b) => {
      if (a.worstRank !== b.worstRank) return a.worstRank - b.worstRank;
      return a.name.localeCompare(b.name, "da");
    });

    const openTickets: DashboardTicket[] = openTicketRows.map((t) => ({
      id: t.id,
      ticket_number:
        typeof (t as { ticket_number?: number | null }).ticket_number === "number"
          ? (t as { ticket_number?: number | null }).ticket_number ?? null
          : null,
      title: t.title,
      status: t.status,
      created_at: t.created_at,
      organisation_id: t.organisation_id,
      organisation_name: orgNames.get(t.organisation_id) ?? "Ukendt",
    }));

    const systemsWithFejlList = buildSystemsWithFejl(latestByOrg, orgNames);

    const pendingReports: DashboardPendingReport[] = pendingReportRows
      .filter((r) => r.status === "draft" || r.status === "approved")
      .map((r) => ({
        id: r.id,
        organisation_id: r.organisation_id,
        organisation_name: orgNames.get(r.organisation_id) ?? "Ukendt",
        period_start: r.period_start,
        period_end: r.period_end,
        status: r.status as "draft" | "approved",
      }));

    console.log("[api/admin/dashboard] GET ok", {
      customers: customers.length,
      warnings: warnings.length,
    });

    return NextResponse.json({
      stats,
      customers,
      openTickets,
      systemsWithFejl: systemsWithFejlList,
      pendingReports,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("[api/admin/dashboard] unhandled exception", error);
    const msg =
      error instanceof Error ? error.message : "Uventet serverfejl i admin-overblik.";
    warnings.push(msg);
    return NextResponse.json({
      stats: emptyStats(),
      customers: [],
      openTickets: [],
      systemsWithFejl: [],
      pendingReports: [],
      warnings,
    });
  }
}
