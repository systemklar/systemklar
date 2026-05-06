import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { getAppOrigin, getResendFromAddress } from "@/lib/resend-welcome-email";

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
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const company_name =
    typeof companyRaw === "string" ? companyRaw.trim() : "";

  if (!email || !company_name) {
    return NextResponse.json(
      { error: "E-mail og virksomhedsnavn er påkrævet." },
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
      role: "org_admin",
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
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: getResendFromAddress(),
      to: email,
      subject: "Du er inviteret til systemklar",
      html: `<p>Hej, du er inviteret til ${organisation.name} på systemklar.</p>
<p>Klik her for at oprette din profil: <a href="${inviteUrl}">${inviteUrl}</a></p>
<p>Linket udløber om 7 dage.</p>`,
    });
  }

  return NextResponse.json({ ok: true, organisation_id: organisation.id });
}
