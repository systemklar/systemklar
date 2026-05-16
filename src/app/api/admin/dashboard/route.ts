import { NextResponse } from "next/server";
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

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

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
        .select("id, title, status, created_at, organisation_id")
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
    console.error("[api/admin/dashboard] organisations", orgsRes.error);
    return NextResponse.json({ error: orgsRes.error.message }, { status: 400 });
  }

  const organisations = orgsRes.data ?? [];
  const orgNames = new Map(organisations.map((o) => [o.id, o.name]));

  const monitoringRows = monitoringRes.error ? [] : (monitoringRes.data ?? []);
  if (monitoringRes.error) {
    console.error("[api/admin/dashboard] monitoring", monitoringRes.error);
  }

  const latestByOrg = latestMonitoringByOrg(monitoringRows);

  const openTicketCountByOrg = new Map<string, number>();
  for (const t of openTicketsRes.error ? [] : (openTicketsRes.data ?? [])) {
    const orgId = (t as { organisation_id: string }).organisation_id;
    openTicketCountByOrg.set(orgId, (openTicketCountByOrg.get(orgId) ?? 0) + 1);
  }
  if (openTicketsRes.error) {
    console.error("[api/admin/dashboard] open ticket counts", openTicketsRes.error);
  }

  let systemsWithFejl = 0;
  for (const latest of latestByOrg.values()) {
    for (const row of latest.values()) {
      if (row.status === "fejl") systemsWithFejl += 1;
    }
  }

  const activeOrgIds = new Set<string>();
  if (!profilesRes.error) {
    for (const p of profilesRes.data ?? []) {
      activeOrgIds.add((p as { organisation_id: string }).organisation_id);
    }
  } else {
    console.warn("[api/admin/dashboard] profiles", profilesRes.error);
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

  const recentTickets: DashboardTicket[] = (ticketsRes.error ? [] : (ticketsRes.data ?? [])).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    created_at: t.created_at,
    organisation_id: t.organisation_id,
    organisation_name: orgNames.get(t.organisation_id) ?? "Ukendt",
  }));

  if (ticketsRes.error) {
    console.error("[api/admin/dashboard] recent tickets", ticketsRes.error);
  }

  const activityRows = activityMonitoringRes.error ? [] : (activityMonitoringRes.data ?? []);
  if (activityMonitoringRes.error) {
    console.error("[api/admin/dashboard] activity monitoring", activityMonitoringRes.error);
  }

  const activity: DashboardActivity[] = detectStatusChangeEvents(activityRows, activitySinceMs, orgNames, 10);

  return NextResponse.json({
    stats,
    customers,
    recentTickets,
    activity,
  });
}
