import { NextResponse } from "next/server";
import { requirePortalOrgAdmin } from "@/lib/require-portal-org-admin";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await context.params;

  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requirePortalOrgAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const { organisationId, profileId: actorId } = auth.session;

  if (profileId === actorId) {
    return NextResponse.json({ error: "Du kan ikke fjerne dig selv." }, { status: 400 });
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", organisationId);

  if (countError) {
    console.error("[api/portal/team/members] count", countError);
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Kan ikke fjerne sidste medlem af organisationen." },
      { status: 400 },
    );
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("profiles")
    .select("id, organisation_id")
    .eq("id", profileId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (memberError) {
    console.error("[api/portal/team/members] select", memberError);
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  if (!member) {
    return NextResponse.json({ error: "Bruger ikke fundet i organisationen." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ organisation_id: null })
    .eq("id", profileId);

  if (updateError) {
    console.error("[api/portal/team/members] update", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
