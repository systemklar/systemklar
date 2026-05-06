import { NextResponse } from "next/server";
import { mergeTicketRowsWithProfiles, resolveDisplayProfilesForOrganisationIds } from "@/lib/admin-ticket-profiles";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/tickets] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: tickets, error } = await admin
    .from("tickets")
    .select("id, title, description, status, organisation_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/admin/tickets] select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = tickets ?? [];
  const organisationIds = rows.map((t) => t.organisation_id as string).filter(Boolean);
  const profileByUserId = await resolveDisplayProfilesForOrganisationIds(admin, organisationIds);
  const merged = mergeTicketRowsWithProfiles(
    rows as unknown as Record<string, unknown>[],
    profileByUserId,
  );

  return NextResponse.json({ tickets: merged });
}
