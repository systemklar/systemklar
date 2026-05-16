import { NextResponse } from "next/server";
import { isLikelyOrganisationDomain, normalizeOrganisationDomainInput } from "@/lib/organisation-domain";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROFILE_EMBED =
  "id, full_name, email, role, avatar_initials, avatar_url, created_at, onboarding_systems";

/** `systems` har ikke FK til organisations; tickets/profiles/invitations har. */
const ORGANISATION_DETAIL_SELECT = `id, name, created_at, domain, logo_url, profiles(${PROFILE_EMBED}), invitations(id, email, contact_name, role, accepted_at, created_at), tickets(id, title, status, created_by_name, created_at)`;

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("domain" in body)) {
    return NextResponse.json({ error: "Mangler feltet domain." }, { status: 400 });
  }

  const raw = (body as { domain: unknown }).domain;
  if (raw !== null && typeof raw !== "string") {
    return NextResponse.json({ error: "domain skal være tekst eller null." }, { status: 400 });
  }

  const normalized = typeof raw === "string" ? normalizeOrganisationDomainInput(raw) : "";
  if (typeof raw === "string" && raw.trim() !== "" && normalized === "") {
    return NextResponse.json({ error: "Kunne ikke tolke domænet. Indtast fx benjasmod.dk uden https://." }, { status: 400 });
  }
  if (!isLikelyOrganisationDomain(normalized)) {
    return NextResponse.json(
      { error: "Domænet ser ikke gyldigt ud. Brug et værtsnavn med punktum, fx benjasmod.dk." },
      { status: 400 }
    );
  }

  const domainToStore = normalized === "" ? null : normalized;

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("organisations")
    .update({ domain: domainToStore })
    .eq("id", id)
    .select(ORGANISATION_DETAIL_SELECT)
    .maybeSingle();

  if (error) {
    console.error("[api/admin/organisations/[id]] PATCH update", error);
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
      console.error("[api/admin/organisations/[id]] PATCH systems", sysError);
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

  // 1. Hent alle profiles for organisationen (auth-uid kan stå i user_id eller id).
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id")
    .eq("organisation_id", organisationId);

  if (profilesError) {
    console.error("[api/admin/organisations/[id]] profiles select", profilesError);
    return NextResponse.json({ error: profilesError.message }, { status: 400 });
  }

  // 2. Slet alle auth-brugere først (FK constraint: skal ske før profiles slettes).
  const authUserIds = new Set<string>();
  for (const profile of profiles ?? []) {
    const fromUserId =
      typeof profile.user_id === "string" && profile.user_id.trim()
        ? profile.user_id.trim()
        : null;
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
      // Fortsæt — vi afbryder ikke hele flowet hvis én bruger fejler.
    }
  }

  // 3. Slet alle invitationer for organisationen.
  const { error: invitationsError } = await supabaseAdmin
    .from("invitations")
    .delete()
    .eq("organisation_id", organisationId);
  if (invitationsError) {
    console.error("[api/admin/organisations/[id]] invitations delete", invitationsError);
    return NextResponse.json({ error: invitationsError.message }, { status: 400 });
  }

  // 4. Slet alle profiles for organisationen.
  const { error: profilesDeleteError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("organisation_id", organisationId);
  if (profilesDeleteError) {
    console.error("[api/admin/organisations/[id]] profiles delete", profilesDeleteError);
    return NextResponse.json({ error: profilesDeleteError.message }, { status: 400 });
  }

  // 5. Slet selve organisationen.
  const { error: orgError } = await supabaseAdmin
    .from("organisations")
    .delete()
    .eq("id", organisationId);
  if (orgError) {
    console.error("[api/admin/organisations/[id]] organisation delete", orgError);
    return NextResponse.json({ error: orgError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    deletedAuthUsers: authUserIds.size,
    ...(warnings.length ? { warning: warnings.join(" | ") } : {}),
  });
}
