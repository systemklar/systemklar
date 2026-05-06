import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** `systems` har ikke FK til organisations; tickets/profiles/invitations har. */
const ORGANISATION_DETAIL_SELECT = "*, profiles(*), invitations(*), tickets(*)";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
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

  const { data, error } = await supabaseAdmin
    .from("organisations")
    .select(ORGANISATION_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[api/admin/organisations/[id]] GET select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  const profiles = Array.isArray((data as { profiles?: unknown }).profiles)
    ? ((data as { profiles: { user_id?: string | null }[] }).profiles ?? [])
    : [];
  const userIds = [...new Set(profiles.map((p) => p.user_id).filter((u): u is string => Boolean(u)))];
  let systems: unknown[] = [];
  if (userIds.length > 0) {
    const { data: sysData, error: sysError } = await supabaseAdmin
      .from("systems")
      .select("*")
      .in("user_id", userIds);
    if (sysError) {
      console.error("[api/admin/organisations/[id]] GET systems", sysError);
    } else {
      systems = sysData ?? [];
    }
  }

  return NextResponse.json({
    organisation: { ...(data as Record<string, unknown>), systems },
  });
}

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
