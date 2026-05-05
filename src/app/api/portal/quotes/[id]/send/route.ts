import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendQuoteEmail } from "@/lib/quote-resend";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
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
    },
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  const { data: quote, error: qErr } = await supabaseAuth
    .from("quotes")
    .select("id, title, content, recipient_email, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 400 });
  }

  if (!quote) {
    return NextResponse.json({ error: "Tilbud ikke fundet." }, { status: 404 });
  }

  const email = String((quote as { recipient_email?: string }).recipient_email ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Modtager-email mangler på tilbuddet." }, { status: 400 });
  }

  const title = String((quote as { title?: string }).title ?? "Tilbud");
  const content = String((quote as { content?: string }).content ?? "");

  const mail = await sendQuoteEmail({
    toEmail: email,
    companyName: "kunde",
    quoteTitle: title,
    quoteId: id,
    contentPreview: content,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: mail.error }, { status: 502 });
  }

  const sentAt = new Date().toISOString();
  const { error: updErr } = await supabaseAuth
    .from("quotes")
    .update({ status: "sent", sent_at: sentAt })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updErr) {
    console.error("[api/portal/quotes/send] update", updErr);
    return NextResponse.json(
      { error: "Mail sendt, men tilbuddet kunne ikke markeres som sendt. Opdater manuelt.", detail: updErr.message },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent_at: sentAt, messageId: mail.messageId });
}
