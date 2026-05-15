import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/resend-welcome-email";

export const dynamic = 'force-dynamic';

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
  const contactNameRaw =
    typeof body === "object" && body !== null && "contact_name" in body
      ? (body as { contact_name: unknown }).contact_name
      : "";
  const organisationRaw =
    typeof body === "object" && body !== null && "organisation_id" in body
      ? (body as { organisation_id: unknown }).organisation_id
      : "";

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const role = roleRaw === "org_admin" ? "org_admin" : "member";
  const contactName = typeof contactNameRaw === "string" ? contactNameRaw.trim() : "";
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
      contact_name: contactName || null,
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

  const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(invitation.token as string)}`;
  try {
    await sendInviteEmail(email, contactName || email, orgName, inviteUrl);
  } catch (error) {
    console.error("[api/invite] sendInviteEmail", error);
  }

  return NextResponse.json({ success: true });
}
