import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { sendTicketClosedEmail } from "@/lib/email";
import { profileWantsTicketUpdatedEmails } from "@/lib/notification-preferences";

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const statusRaw =
    typeof body === "object" && body !== null && "status" in body
      ? (body as { status: unknown }).status
      : null;

  if (statusRaw !== "active" && statusRaw !== "resolved") {
    return NextResponse.json({ error: "status skal være active eller resolved." }, { status: 400 });
  }

  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* ignore */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: ticketRow, error: fetchErr } = await admin
    .from("tickets")
    .select("organisation_id,title")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !ticketRow) {
    return NextResponse.json({ error: "Ticket ikke fundet." }, { status: 404 });
  }

  const ownerOrgId = ticketRow.organisation_id as string;
  const { data: requesterProfile } = await admin
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  const requesterOrgId = requesterProfile?.organisation_id as string | undefined;

  if (!isAdminEmail(user.email) && (!requesterOrgId || requesterOrgId !== ownerOrgId)) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  const { error: updErr } = await admin.from("tickets").update({ status: statusRaw }).eq("id", id);

  if (updErr) {
    console.error("[api/tickets/[id]/status]", updErr);
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  if (statusRaw === "resolved") {
    try {
      const { data: recipients } = await admin
        .from("profiles")
        .select(
          "email, full_name, notification_preferences, notif_new_message, notif_status_change",
        )
        .eq("organisation_id", ownerOrgId);
      const title = ((ticketRow as { title?: string }).title ?? "Supportsag").trim() || "Supportsag";
      for (const recipient of recipients ?? []) {
        const wantsEmail = profileWantsTicketUpdatedEmails(
          recipient.notification_preferences,
          {
            notif_new_message: recipient.notif_new_message as boolean | null,
            notif_status_change: recipient.notif_status_change as boolean | null,
          },
        );
        if (!wantsEmail) continue;
        const email = (recipient.email as string | undefined)?.trim();
        if (!email) continue;
        await sendTicketClosedEmail(
          email,
          ((recipient.full_name as string | undefined)?.trim() || "der"),
          title,
          id
        );
      }
    } catch (error) {
      console.error("[api/tickets/[id]/status] sendTicketClosedEmail", error);
    }
  }

  return NextResponse.json({ ok: true, status: statusRaw });
}
