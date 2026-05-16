import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { sendTicketReplyEmail } from "@/lib/email";
import { profileWantsTicketUpdatedEmails } from "@/lib/notification-preferences";

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const content =
    typeof body === "object" && body !== null && "content" in body
      ? String((body as { content?: unknown }).content ?? "").trim()
      : "";
  const sendAsAdmin =
    typeof body === "object" && body !== null && "sendAsAdmin" in body
      ? Boolean((body as { sendAsAdmin?: unknown }).sendAsAdmin)
      : false;

  if (!content) {
    return NextResponse.json({ error: "Besked kan ikke være tom." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, title, organisation_id, ticket_number")
    .eq("id", id)
    .maybeSingle();
  if (ticketError || !ticket?.organisation_id) {
    return NextResponse.json({ error: "Ticket ikke fundet." }, { status: 404 });
  }

  const canAdmin = isAdminEmail(user.email) || profile?.role === "org_admin";
  const sameOrg = profile?.organisation_id && profile.organisation_id === ticket.organisation_id;
  if (!canAdmin && !sameOrg) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }
  if (sendAsAdmin && !canAdmin) {
    return NextResponse.json({ error: "Ingen adgang til admin-beskeder." }, { status: 403 });
  }

  const senderName =
    (profile?.full_name as string | null)?.trim() || user.user_metadata?.full_name || user.email || (sendAsAdmin ? "Admin" : "Kunde");
  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      ticket_id: id,
      user_id: user.id,
      content,
      is_admin: sendAsAdmin,
      sender_name: senderName,
      sender_role: sendAsAdmin ? "admin" : "customer",
    })
    .select("id")
    .single();
  if (insertError || !insertedMessage?.id) {
    return NextResponse.json({ error: insertError?.message ?? "Kunne ikke gemme besked." }, { status: 400 });
  }

  if (sendAsAdmin) {
    try {
      const { data: recipients } = await supabase
        .from("profiles")
        .select(
          "email, full_name, notification_preferences, notif_new_message, notif_status_change",
        )
        .eq("organisation_id", ticket.organisation_id);
      const ticketTitle = (ticket.title as string | null)?.trim() || "Supportsag";
      const preview = content.length > 220 ? `${content.slice(0, 220)}...` : content;
      for (const recipient of recipients ?? []) {
        const wantsEmail = profileWantsTicketUpdatedEmails(
          recipient.notification_preferences,
          {
            notif_new_message: recipient.notif_new_message as boolean | null,
            notif_status_change: recipient.notif_status_change as boolean | null,
          },
        );
        if (!wantsEmail) continue;
        const email = (recipient.email as string | null)?.trim();
        if (!email) continue;
        await sendTicketReplyEmail(
          email,
          ((recipient.full_name as string | null)?.trim() || "der"),
          ticketTitle,
          id,
          preview,
          (ticket as { ticket_number?: number }).ticket_number ?? null,
        );
      }
    } catch (error) {
      console.error("[api/tickets/[id]/messages] sendTicketReplyEmail", error);
    }
  }

  return NextResponse.json({ success: true, messageId: insertedMessage.id as string });
}
