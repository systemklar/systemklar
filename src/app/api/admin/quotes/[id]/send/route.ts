import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
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

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  const { data: quote, error: qErr } = await supabaseAuth
    .from("quotes")
    .select("id, title, content, customer_profile_id, status")
    .eq("id", id)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 400 });
  }

  if (!quote) {
    return NextResponse.json({ error: "Tilbud ikke fundet." }, { status: 404 });
  }

  const profileId = quote.customer_profile_id as string;

  const { data: profile, error: pErr } = await supabaseAuth
    .from("profiles")
    .select("company_name, email")
    .eq("id", profileId)
    .maybeSingle();

  if (pErr || !profile) {
    return NextResponse.json({ error: "Kundeprofil ikke fundet." }, { status: 404 });
  }

  const email = String((profile as { email?: string }).email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Kunden har ingen e-mail på profilen." }, { status: 400 });
  }

  const title = String((quote as { title?: string }).title ?? "Tilbud");
  const content = String((quote as { content?: string }).content ?? "");
  const companyName = String((profile as { company_name?: string }).company_name ?? "kunde");

  const mail = await sendQuoteEmail({
    toEmail: email,
    companyName,
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
    .eq("id", id);

  if (updErr) {
    console.error("[api/admin/quotes/send] update", updErr);
    return NextResponse.json(
      { error: "Mail sendt, men tilbuddet kunne ikke markeres som sendt. Opdater manuelt.", detail: updErr.message },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent_at: sentAt, messageId: mail.messageId });
}
