import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { runMonitoringForOrganisation } from "@/lib/monitoring/run-for-organisation";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const orgId =
    typeof body === "object" && body !== null && "organisationId" in body
      ? String((body as { organisationId: unknown }).organisationId ?? "").trim()
      : "";

  if (!orgId) {
    return NextResponse.json({ error: "Mangler organisationId." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const result = await runMonitoringForOrganisation(admin, orgId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Overvågning fejlede." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    systemsChecked: result.systemsChecked,
    message: result.message,
  });
}
