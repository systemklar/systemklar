import { NextResponse } from "next/server";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  countsFromLatestBySystem,
  detectStatusChangeEvents,
  emptyMonitoringCounts,
  latestMonitoringByOrg,
  rowAccentFromCounts,
  worstRankFromCounts,
  type DashboardActivity,
  type DashboardStats,
  type DashboardTicket,
  type OrganisationDashboardRow,
} from "@/lib/admin/dashboard-data";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const MONITORING_LOOKBACK_DAYS = 45;
const ACTIVITY_HOURS = 24;

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

async function fetchRecentTickets(admin: SupabaseClient, warnings: string[]) {
  console.log("[api/admin/dashboard] query:start tickets (seneste)");
  const primary = await admin
    .from("tickets")
    .select("id, ticket_number, title, status, created_at, organisation_id")
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!primary.error) {
    console.log("[api/admin/dashboard] query:ok tickets (seneste)", primary.data?.length ?? 0);
    return primary.data ?? [];
  }

  logQueryFail("tickets (seneste)", primary.error);
  const msg = primary.error.message ?? "";
  if (msg.includes("ticket_number") || primary.error.code === "42703") {
    console.log("[api/admin/dashboard] query:retry tickets (seneste) uden ticket_number");
    const fallback = await admin
      .from("tickets")
      .select("id, title, status, created_at, organisation_id")
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(5);
    if (fallback.error) {
      logQueryFail("tickets (seneste) fallback", fallback.error);
      warnings.push(formatQueryError("tickets (seneste)", fallback.error));
      return [];
    }
    console.log("[api/admin/dashboard] query:ok tickets (seneste) fallback", fallback.data?.length ?? 0);
    warnings.push(
      "ticket_number-kolonnen findes ikke endnu — kør migration 032_ticket_numbers.sql.",
    );
    return fallback.data ?? [];
  }

  warnings.push(formatQueryError("tickets (seneste)", primary.error));
  return [];
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
        recentTickets: [],
        activity: [],
        warnings,
      });
    }

    const monitoringSince = new Date(
      Date.now() - MONITORING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const activitySinceMs = Date.now() - ACTIVITY_HOURS * 60 * 60 * 1000;
    const activityFetchSince = new Date(activitySinceMs - 24 * 60 * 60 * 1000).toISOString();

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

    const monitoringRows = monitoringRes.error ? [] : (monitoringRes.data ?? []);
    if (monitoringRes.error) {
      logQueryFail("monitoring_results", monitoringRes.error);
      warnings.push(formatQueryError("monitoring_results", monitoringRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok monitoring_results", monitoringRows.length);
    }

    console.log("[api/admin/dashboard] query:start monitoring aktivitet");
    const activityMonitoringRes = await admin
      .from("monitoring_results")
      .select("organisation_id, system_name, status, checked_at")
      .gte("checked_at", activityFetchSince)
      .order("checked_at", { ascending: true });

    const activityRows = activityMonitoringRes.error ? [] : (activityMonitoringRes.data ?? []);
    if (activityMonitoringRes.error) {
      logQueryFail("monitoring aktivitet", activityMonitoringRes.error);
      warnings.push(formatQueryError("monitoring aktivitet", activityMonitoringRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok monitoring aktivitet", activityRows.length);
    }

    const recentTicketRows = await fetchRecentTickets(admin, warnings);

    console.log("[api/admin/dashboard] query:start tickets (åbne)");
    const openTicketsRes = await admin
      .from("tickets")
      .select("organisation_id")
      .neq("status", "resolved");

    const openTicketCountByOrg = new Map<string, number>();
    if (openTicketsRes.error) {
      logQueryFail("tickets (åbne)", openTicketsRes.error);
      warnings.push(formatQueryError("tickets (åbne)", openTicketsRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok tickets (åbne)", openTicketsRes.data?.length ?? 0);
      for (const t of openTicketsRes.data ?? []) {
        const orgId = (t as { organisation_id: string }).organisation_id;
        openTicketCountByOrg.set(orgId, (openTicketCountByOrg.get(orgId) ?? 0) + 1);
      }
    }

    console.log("[api/admin/dashboard] query:start it_reports");
    const reportsRes = await admin
      .from("it_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "approved"]);

    if (reportsRes.error) {
      logQueryFail("it_reports", reportsRes.error);
      warnings.push(formatQueryError("it_reports", reportsRes.error));
    } else {
      console.log("[api/admin/dashboard] query:ok it_reports count", reportsRes.count ?? 0);
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

    const latestByOrg = latestMonitoringByOrg(monitoringRows);

    let systemsWithFejl = 0;
    for (const latest of latestByOrg.values()) {
      for (const row of latest.values()) {
        if (row.status === "fejl") systemsWithFejl += 1;
      }
    }

    const stats: DashboardStats = {
      activeCustomers: activeOrgIds.size,
      systemsWithFejl,
      openTickets: openTicketsRes.error ? 0 : (openTicketsRes.data?.length ?? 0),
      reportsReady: reportsRes.error ? 0 : (reportsRes.count ?? 0),
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

    const recentTickets: DashboardTicket[] = recentTicketRows.map((t) => ({
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

    const activity: DashboardActivity[] = detectStatusChangeEvents(
      activityRows,
      activitySinceMs,
      orgNames,
      10,
    );

    console.log("[api/admin/dashboard] GET ok", {
      customers: customers.length,
      warnings: warnings.length,
    });

    return NextResponse.json({
      stats,
      customers,
      recentTickets,
      activity,
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
      recentTickets: [],
      activity: [],
      warnings,
    });
  }
}
