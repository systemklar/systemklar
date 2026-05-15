import { NextResponse } from "next/server";
import { mergeTicketRowsWithProfiles, resolveDisplayProfilesForOrganisationIds } from "@/lib/admin-ticket-profiles";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/tickets/[id]] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: ticket, error } = await admin
    .from("tickets")
    .select("id, title, description, status, organisation_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[api/admin/tickets/[id]] select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!ticket) {
    return NextResponse.json({ error: "Ikke fundet." }, { status: 404 });
  }

  const uid = ticket.organisation_id as string;
  const profileByUserId = await resolveDisplayProfilesForOrganisationIds(admin, [uid]);
  const merged = mergeTicketRowsWithProfiles(
    [ticket as unknown as Record<string, unknown>],
    profileByUserId,
  );
  const row = merged[0];
  if (!row) {
    return NextResponse.json({ error: "Ikke fundet." }, { status: 404 });
  }

  return NextResponse.json({ ticket: row });
}
