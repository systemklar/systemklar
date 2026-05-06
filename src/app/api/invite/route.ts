import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppOrigin, getResendFromAddress } from "@/lib/resend-welcome-email";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* ignore */
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  const { data: senderProfile, error: senderError } = await supabase
    .from("profiles")
    .select("id, organisation_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (senderError || !senderProfile) {
    return NextResponse.json({ error: "Kunne ikke hente afsenderprofil." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const emailRaw =
    typeof body === "object" && body !== null && "email" in body ? (body as { email: unknown }).email : "";
  const roleRaw =
    typeof body === "object" && body !== null && "role" in body ? (body as { role: unknown }).role : "member";
  const organisationRaw =
    typeof body === "object" && body !== null && "organisation_id" in body
      ? (body as { organisation_id: unknown }).organisation_id
      : "";

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const role = roleRaw === "org_admin" ? "org_admin" : "member";
  const organisation_id = typeof organisationRaw === "string" ? organisationRaw : "";

  if (!email || !organisation_id) {
    return NextResponse.json({ error: "E-mail og organisation_id er påkrævet." }, { status: 400 });
  }

  if (senderProfile.role !== "org_admin" || senderProfile.organisation_id !== organisation_id) {
    return NextResponse.json({ error: "Ingen adgang til at invitere i denne organisation." }, { status: 403 });
  }

  const [existingMember, existingInvite] = await Promise.all([
    supabase.from("profiles").select("id").eq("organisation_id", organisation_id).eq("email", email).maybeSingle(),
    supabase
      .from("invitations")
      .select("id")
      .eq("organisation_id", organisation_id)
      .eq("email", email)
      .is("accepted_at", null)
      .maybeSingle(),
  ]);

  if (existingMember.data?.id) {
    return NextResponse.json({ error: "Brugeren er allerede medlem af organisationen." }, { status: 400 });
  }
  if (existingInvite.data?.id) {
    return NextResponse.json({ error: "Der findes allerede en afventende invitation til denne e-mail." }, { status: 400 });
  }

  const { data: invitation, error: inviteError } = await supabase
    .from("invitations")
    .insert({
      organisation_id,
      email,
      role,
      invited_by: senderProfile.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: inviteError?.message ?? "Kunne ikke oprette invitation." }, { status: 400 });
  }

  const { data: orgData } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", organisation_id)
    .maybeSingle();
  const orgName = (orgData?.name as string | undefined)?.trim() || "din organisation";

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(invitation.token as string)}`;
    await resend.emails.send({
      from: getResendFromAddress(),
      to: email,
      subject: `Du er inviteret til ${orgName} på systemklar`,
      html: `<div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto;">
  <h2>Du er inviteret til ${orgName}</h2>
  <p>Du er blevet inviteret til at få adgang til systemklar for ${orgName}.</p>
  <a href="${inviteUrl}" 
     style="background: #0A6EBD; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; display: inline-block; margin: 16px 0;">
    Opret din profil
  </a>
  <p style="color: #4A8CB5; font-size: 14px;">Linket udløber om 7 dage.</p>
</div>`,
    });
  }

  return NextResponse.json({ success: true });
}
