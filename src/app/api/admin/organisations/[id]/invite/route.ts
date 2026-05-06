import { randomUUID } from "crypto";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { getAppOrigin, getResendFromAddress } from "@/lib/resend-welcome-email";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const emailRaw =
    typeof body === "object" && body !== null && "email" in body ? (body as { email: unknown }).email : "";
  const roleRaw =
    typeof body === "object" && body !== null && "role" in body ? (body as { role: unknown }).role : "member";
  const contactRaw =
    typeof body === "object" && body !== null && "contact_name" in body
      ? (body as { contact_name: unknown }).contact_name
      : "";

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const contactName = typeof contactRaw === "string" ? contactRaw.trim() : "";
  const role = roleRaw === "org_admin" ? "org_admin" : "member";
  if (!email || !contactName) {
    return NextResponse.json({ error: "Kontaktperson og email er påkrævet." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const [existingMember, existingInvite, orgRes] = await Promise.all([
    admin.from("profiles").select("id").eq("organisation_id", id).eq("email", email).maybeSingle(),
    admin.from("invitations").select("id").eq("organisation_id", id).eq("email", email).is("accepted_at", null).maybeSingle(),
    admin.from("organisations").select("name").eq("id", id).maybeSingle(),
  ]);

  if (existingMember.data?.id) {
    return NextResponse.json({ error: "Brugeren er allerede medlem af organisationen." }, { status: 400 });
  }
  if (existingInvite.data?.id) {
    return NextResponse.json({ error: "Der findes allerede en afventende invitation til denne e-mail." }, { status: 400 });
  }
  if (!orgRes.data?.name) {
    return NextResponse.json({ error: "Organisation ikke fundet." }, { status: 404 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: invitationError } = await admin.from("invitations").insert({
    organisation_id: id,
    email,
    role,
    contact_name: contactName,
    expires_at: expiresAt,
    token,
  });
  if (invitationError) {
    return NextResponse.json({ error: invitationError.message }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const orgName = orgRes.data.name as string;
    const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(token)}`;
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: getResendFromAddress(),
      to: email,
      subject: `Du er inviteret til ${orgName} på systemklar`,
      html: `<p>Hej ${contactName}, du er inviteret til ${orgName} på systemklar.</p>
<p>Klik her for at oprette din profil: <a href="${inviteUrl}">${inviteUrl}</a></p>
<p>Linket udløber om 7 dage.</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
