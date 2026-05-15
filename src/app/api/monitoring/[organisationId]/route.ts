import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { requireOrganisationOrAdminAccess } from "@/lib/require-monitoring-api";

export type MonitoringResultDto = {
  system_name: string;
  status: string;
  checked_at: string;
  details: Record<string, unknown>;
};

export async function GET(_request: Request, context: { params: Promise<{ organisationId: string }> }) {
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
    const r = row as MonitoringResultDto;
    if (!latestByName.has(r.system_name)) {
      latestByName.set(r.system_name, {
        system_name: r.system_name,
        status: r.status,
        checked_at: r.checked_at,
        details: (r.details as Record<string, unknown>) ?? {},
      });
    }
  }

  return NextResponse.json({ results: [...latestByName.values()] });
}
