import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const organisationId = id;

  // Hent bruger-id'er før organisation slettes (FK/CASCADE kan ellers fjerne profiler).
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("user_id, id")
    .eq("organisation_id", organisationId);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("organisations").delete().eq("id", organisationId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const authUserIds = new Set<string>();
  for (const profile of profiles ?? []) {
    const fromUserId =
      typeof profile.user_id === "string" && profile.user_id.trim() ? profile.user_id.trim() : null;
    const fromProfileId =
      typeof profile.id === "string" && profile.id.trim() ? profile.id.trim() : null;
    const uid = fromUserId ?? fromProfileId;
    if (uid) {
      authUserIds.add(uid);
    }
  }

  const warnings: string[] = [];
  for (const authUid of authUserIds) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUid);
    if (authError) {
      const detail = authError.message || "Ukendt fejl";
      console.error("[api/admin/organisations/[id]] deleteUser failed", {
        organisationId,
        authUid,
        detail,
      });
      warnings.push(`Auth ${authUid}: ${detail}`);
    }
  }

  return NextResponse.json({
    success: true,
    ...(warnings.length ? { warning: warnings.join(" | ") } : {}),
  });
}
