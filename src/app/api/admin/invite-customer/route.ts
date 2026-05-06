import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { sendInviteEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/resend-welcome-email";

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

  const emailRaw =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : null;
  const companyRaw =
    typeof body === "object" && body !== null && "company_name" in body
      ? (body as { company_name: unknown }).company_name
      : null;
  const contactNameRaw =
    typeof body === "object" && body !== null && "contact_name" in body
      ? (body as { contact_name: unknown }).contact_name
      : null;
  const roleRaw =
    typeof body === "object" && body !== null && "role" in body
      ? (body as { role: unknown }).role
      : null;
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const company_name =
    typeof companyRaw === "string" ? companyRaw.trim() : "";
  const contact_name = typeof contactNameRaw === "string" ? contactNameRaw.trim() : "";
  const role = roleRaw === "member" ? "member" : "org_admin";

  if (!email || !company_name || !contact_name) {
    return NextResponse.json(
      { error: "E-mail, kontaktperson og virksomhedsnavn er påkrævet." },
      { status: 400 }
    );
  }

  const admin = getServiceClient();
  const { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .insert({ name: company_name })
    .select("id,name")
    .single();

  if (organisationError || !organisation) {
    return NextResponse.json(
      { error: organisationError?.message ?? "Kunne ikke oprette organisation." },
      { status: 400 },
    );
  }

  const { data: invitation, error: invitationError } = await admin
    .from("invitations")
    .insert({
      organisation_id: organisation.id,
      email,
      role,
      contact_name,
      invited_by: adminUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token, expires_at")
    .single();

  if (invitationError || !invitation) {
    await admin.from("organisations").delete().eq("id", organisation.id);
    return NextResponse.json(
      { error: invitationError?.message ?? "Kunne ikke oprette invitation." },
      { status: 400 },
    );
  }

  const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(invitation.token as string)}`;
  try {
    await sendInviteEmail(email, contact_name || email, organisation.name as string, inviteUrl);
  } catch (error) {
    console.error("[api/admin/invite-customer] sendInviteEmail", error);
  }

  return NextResponse.json({ ok: true, organisation_id: organisation.id });
}
