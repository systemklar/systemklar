import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email";
import { requirePortalOrgAdmin } from "@/lib/require-portal-org-admin";
import { getAppOrigin } from "@/lib/resend-welcome-email";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resend a pending organisation invitation (org admin only). */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requirePortalOrgAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const { organisationId } = auth.session;
  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: invitation, error } = await admin
    .from("invitations")
    .select("id,email,role,organisation_id,contact_name,accepted_at,organisations(name)")
    .eq("id", id)
    .eq("organisation_id", organisationId)
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

  try {
    await sendInviteEmail(invitation.email as string, contactName, orgName, inviteUrl);
  } catch (emailError) {
    console.error("[api/portal/team/invitations] sendInviteEmail", emailError);
    return NextResponse.json(
      { error: "Invitationen blev opdateret, men e-mailen kunne ikke sendes." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
