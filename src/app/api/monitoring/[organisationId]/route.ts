import { NextResponse } from "next/server";
import { buildDailyPctOkFromRows } from "@/lib/monitoring/history-daily";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { requireOrganisationOrAdminAccess } from "@/lib/require-monitoring-api";

export type MonitoringResultDto = {
  system_name: string;
  status: string;
  checked_at: string;
  details: Record<string, unknown>;
};

function mapRow(row: unknown): MonitoringResultDto {
  const r = row as MonitoringResultDto;
  return {
    system_name: r.system_name,
    status: r.status,
    checked_at: r.checked_at,
    details: (r.details as Record<string, unknown>) ?? {},
  };
}

export async function GET(request: Request, context: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await context.params;
  if (!organisationId?.trim()) {
    return NextResponse.json({ error: "Mangler organisationId." }, { status: 400 });
  }

  const auth = await requireOrganisationOrAdminAccess(organisationId);
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const url = new URL(request.url);
  const wantHistory = url.searchParams.get("history") === "true";

  if (wantHistory) {
    const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("monitoring_results")
      .select("system_name, status, checked_at, details")
      .eq("organisation_id", organisationId)
      .gte("checked_at", sinceIso)
      .order("checked_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data ?? []).map(mapRow);
    const historyBySystem: Record<string, MonitoringResultDto[]> = {};
    for (const dto of rows) {
      const list = historyBySystem[dto.system_name] ?? [];
      list.push(dto);
      historyBySystem[dto.system_name] = list;
    }
    for (const key of Object.keys(historyBySystem)) {
      historyBySystem[key].sort(
        (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
      );
    }

    const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const dailyPctOk = buildDailyPctOkFromRows(
      rows.map((r) => ({ system_name: r.system_name, status: r.status, checked_at: r.checked_at })),
      sinceMs,
    );

    return NextResponse.json({ historyBySystem, dailyPctOk });
  }

  const { data, error } = await admin
    .from("monitoring_results")
    .select("system_name, status, checked_at, details")
    .eq("organisation_id", organisationId)
    .order("checked_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const latestByName = new Map<string, MonitoringResultDto>();
  for (const row of data ?? []) {
    const r = mapRow(row);
    if (!latestByName.has(r.system_name)) {
      latestByName.set(r.system_name, r);
    }
  }

  return NextResponse.json({ results: [...latestByName.values()] });
}
