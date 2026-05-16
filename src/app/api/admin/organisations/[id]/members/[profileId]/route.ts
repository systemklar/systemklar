import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; profileId: string }> },
) {
  const { id: organisationId, profileId } = await context.params;

  if (!UUID_RE.test(organisationId) || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
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
    console.error("[api/admin/organisations/.../members] count", countError);
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
    console.error("[api/admin/organisations/.../members] select member", memberError);
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
    console.error("[api/admin/organisations/.../members] update", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
