import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { getAppOrigin } from "@/lib/resend-welcome-email";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createUserClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type InviteCustomerRowResult = {
  profile_id: string;
  email: string;
  ok: boolean;
  message?: string;
  error?: string;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Manglende adgangstoken." }, { status: 401 });
  }

  const userClient = createUserClient(accessToken);
  const {
    data: { user: adminUser },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !adminUser) {
    return NextResponse.json({ error: "Ugyldig session." }, { status: 401 });
  }

  if (!isAdminEmail(adminUser.email)) {
    return NextResponse.json({ error: "Ingen admin-adgang." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const idsRaw =
    typeof body === "object" && body !== null && "profile_ids" in body
      ? (body as { profile_ids: unknown }).profile_ids
      : null;

  if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
    return NextResponse.json({ error: "profile_ids skal være et ikke-tomt array." }, { status: 400 });
  }

  const profileIds = idsRaw.filter((id): id is string => typeof id === "string" && UUID_RE.test(id));

  if (profileIds.length === 0) {
    return NextResponse.json({ error: "Ingen gyldige profil-id." }, { status: 400 });
  }

  const admin = getServiceClient();
  const redirectTo = `${getAppOrigin()}/set-password`;
  const results: InviteCustomerRowResult[] = [];

  for (const profileId of profileIds) {
    const { data: profile, error: fetchErr } = await admin
      .from("profiles")
      .select("id, email, company_name, invited_at")
      .eq("id", profileId)
      .maybeSingle();

    if (fetchErr || !profile) {
      console.error("[invite-customers] fetch profile", profileId, fetchErr?.message);
      results.push({
        profile_id: profileId,
        email: "",
        ok: false,
        error: "Profil ikke fundet.",
      });
      continue;
    }

    const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
    const company_name =
      typeof profile.company_name === "string" ? profile.company_name.trim() : "";

    if (!email || !company_name) {
      results.push({
        profile_id: profileId,
        email: email || "—",
        ok: false,
        error: "Profilen mangler e-mail eller firmanavn.",
      });
      continue;
    }

    if (profile.invited_at != null) {
      results.push({
        profile_id: profileId,
        email,
        ok: false,
        error: "Allerede inviteret.",
      });
      continue;
    }

    // Supabase sender selv invite-e-mail; ingen separat Resend-velkomst her.
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { company_name },
        redirectTo,
      }
    );

    if (inviteError || !inviteData.user) {
      console.error("[invite-customers] inviteUserByEmail", {
        email,
        message: inviteError?.message,
      });
      results.push({
        profile_id: profileId,
        email,
        ok: false,
        error:
          inviteError?.message ??
          "Kunne ikke sende invitation (e-mailen kan allerede være registreret).",
      });
      continue;
    }

    const userId = inviteData.user.id;
    const nowIso = new Date().toISOString();

    const { error: updErr } = await admin
      .from("profiles")
      .update({ user_id: userId, invited_at: nowIso })
      .eq("id", profileId);

    if (updErr) {
      console.error("[invite-customers] profile update", profileId, updErr);
      await admin.auth.admin.deleteUser(userId);
      results.push({
        profile_id: profileId,
        email,
        ok: false,
        error: updErr.message ?? "Kunne ikke opdatere profil.",
      });
      continue;
    }

    results.push({
      profile_id: profileId,
      email,
      ok: true,
      message: `Invitation sendt til ${email}`,
    });

    console.log("[invite-customers] completed", { profileId, email });
  }

  return NextResponse.json({ results });
}
