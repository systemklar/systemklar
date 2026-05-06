import { randomUUID } from "crypto";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { getAppOrigin, getResendFromAddress } from "@/lib/resend-welcome-email";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: invitation, error } = await admin
    .from("invitations")
    .select("id,email,role,organisation_id,contact_name,accepted_at,organisations(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invitation ikke fundet." }, { status: 404 });
  }
  if (invitation.accepted_at) {
    return NextResponse.json({ error: "Invitationen er allerede accepteret." }, { status: 400 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await admin
    .from("invitations")
    .update({ token, expires_at: expiresAt })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const orgName = Array.isArray(invitation.organisations)
    ? invitation.organisations[0]?.name ?? "din organisation"
    : ((invitation.organisations as { name?: string } | null)?.name ?? "din organisation");
  const contactName = (invitation.contact_name as string | null)?.trim() || invitation.email;
  const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(token)}`;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: getResendFromAddress(),
      to: invitation.email as string,
      subject: `Du er inviteret til ${orgName} på systemklar`,
      html: `<p>Hej ${contactName}, du er inviteret til ${orgName} på systemklar.</p>
<p>Klik her for at oprette din profil: <a href="${inviteUrl}">${inviteUrl}</a></p>
<p>Linket udløber om 7 dage.</p>`,
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { error } = await admin.from("invitations").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
