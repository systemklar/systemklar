import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
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

function formatQueryError(scope: string, error: PostgrestError): string {
  const parts = [error.message, error.details, error.hint, error.code ? `(${error.code})` : ""]
    .filter(Boolean)
    .join(" — ");
  console.error(`[api/admin/dashboard] ${scope}`, error);
  return `${scope}: ${parts || "Ukendt databasefejl"}`;
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    const msg =
      "SUPABASE_SERVICE_ROLE_KEY mangler i miljøvariabler — admin-overblik kan ikke hente data.";
    console.error("[api/admin/dashboard]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const queryErrors: string[] = [];

  const monitoringSince = new Date(Date.now() - MONITORING_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const activitySinceMs = Date.now() - ACTIVITY_HOURS * 60 * 60 * 1000;
  const activityFetchSince = new Date(activitySinceMs - 24 * 60 * 60 * 1000).toISOString();

  const [orgsRes, monitoringRes, activityMonitoringRes, ticketsRes, openTicketsRes, reportsRes, profilesRes] =
    await Promise.all([
      admin.from("organisations").select("id, name, domain, logo_url").order("name", { ascending: true }),
      admin
        .from("monitoring_results")
        .select("organisation_id, system_name, status, checked_at")
        .gte("checked_at", monitoringSince)
        .order("checked_at", { ascending: false }),
      admin
        .from("monitoring_results")
        .select("organisation_id, system_name, status, checked_at")
        .gte("checked_at", activityFetchSince)
        .order("checked_at", { ascending: true }),
      admin
        .from("tickets")
        .select("id, ticket_number, title, status, created_at, organisation_id")
        .neq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(5),
      admin.from("tickets").select("organisation_id").neq("status", "resolved"),
      admin
        .from("it_reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "approved"]),
      admin.from("profiles").select("organisation_id").not("organisation_id", "is", null),
    ]);

  if (orgsRes.error) {
    const msg = formatQueryError("organisations", orgsRes.error);
    return NextResponse.json({ error: msg, errors: [msg] }, { status: 400 });
  }

  const organisations = orgsRes.data ?? [];
  const orgNames = new Map(organisations.map((o) => [o.id, o.name]));

  type TicketRow = {
    id: string;
    title: string;
    status: string;
    created_at: string;
    organisation_id: string;
    ticket_number?: number | null;
  };
  let recentTicketRows: TicketRow[] = ticketsRes.error ? [] : ((ticketsRes.data ?? []) as TicketRow[]);
  if (ticketsRes.error) {
    const ticketErr = ticketsRes.error;
    if (ticketErr.message?.includes("ticket_number")) {
      const fallback = await admin
        .from("tickets")
        .select("id, title, status, created_at, organisation_id")
        .neq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(5);
      if (fallback.error) {
        queryErrors.push(formatQueryError("tickets (seneste)", fallback.error));
      } else {
        recentTicketRows = fallback.data ?? [];
        queryErrors.push(
          "ticket_number-kolonnen findes ikke endnu — kør migration 032_ticket_numbers.sql.",
        );
      }
    } else {
      queryErrors.push(formatQueryError("tickets (seneste)", ticketErr));
    }
  }

  const monitoringRows = monitoringRes.error ? [] : (monitoringRes.data ?? []);
  if (monitoringRes.error) {
    queryErrors.push(formatQueryError("monitoring_results", monitoringRes.error));
  }

  const latestByOrg = latestMonitoringByOrg(monitoringRows);

  const openTicketCountByOrg = new Map<string, number>();
  if (openTicketsRes.error) {
    queryErrors.push(formatQueryError("tickets (åbne)", openTicketsRes.error));
  } else {
    for (const t of openTicketsRes.data ?? []) {
      const orgId = (t as { organisation_id: string }).organisation_id;
      openTicketCountByOrg.set(orgId, (openTicketCountByOrg.get(orgId) ?? 0) + 1);
    }
  }

  let systemsWithFejl = 0;
  for (const latest of latestByOrg.values()) {
    for (const row of latest.values()) {
      if (row.status === "fejl") systemsWithFejl += 1;
    }
  }

  const activeOrgIds = new Set<string>();
  if (profilesRes.error) {
    queryErrors.push(formatQueryError("profiles", profilesRes.error));
  } else {
    for (const p of profilesRes.data ?? []) {
      activeOrgIds.add((p as { organisation_id: string }).organisation_id);
    }
  }

  if (reportsRes.error) {
    queryErrors.push(formatQueryError("it_reports", reportsRes.error));
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
      typeof (t as { ticket_number?: number }).ticket_number === "number"
        ? (t as { ticket_number: number }).ticket_number
        : null,
    title: t.title,
    status: t.status,
    created_at: t.created_at,
    organisation_id: t.organisation_id,
    organisation_name: orgNames.get(t.organisation_id) ?? "Ukendt",
  }));

  const activityRows = activityMonitoringRes.error ? [] : (activityMonitoringRes.data ?? []);
  if (activityMonitoringRes.error) {
    queryErrors.push(formatQueryError("monitoring aktivitet", activityMonitoringRes.error));
  }

  const activity: DashboardActivity[] = detectStatusChangeEvents(activityRows, activitySinceMs, orgNames, 10);

  return NextResponse.json({
    stats,
    customers,
    recentTickets,
    activity,
    warnings: queryErrors.length > 0 ? queryErrors : undefined,
  });
}
