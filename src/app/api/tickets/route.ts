import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { sendNewTicketEmailToAdmin } from "@/lib/email";

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

  const title =
    typeof body === "object" && body !== null && "title" in body
      ? String((body as { title?: unknown }).title ?? "").trim()
      : "";
  const description =
    typeof body === "object" && body !== null && "description" in body
      ? String((body as { description?: unknown }).description ?? "").trim()
      : "";
  if (!title) {
    return NextResponse.json({ error: "Titel er påkrævet." }, { status: 400 });
  }

  const profile = await fetchCurrentProfile(supabase, user.id);
  if (!profile?.organisation_id) {
    return NextResponse.json({ error: "Organisation ikke fundet." }, { status: 400 });
  }

  const createdByName = profile.full_name ?? profile.email ?? "Kunde";
  const { data: inserted, error: insertError } = await supabase
    .from("tickets")
    .insert({
      title,
      description: description || null,
      status: "active" as const,
      organisation_id: profile.organisation_id,
      created_by_name: createdByName,
    })
    .select("id,title")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "Kunne ikke oprette sag." }, { status: 400 });
  }

  try {
    await sendNewTicketEmailToAdmin(
      inserted.title as string,
      profile.company_name?.trim() || "Ukendt virksomhed",
      createdByName,
      inserted.id as string
    );
  } catch (error) {
    console.error("[api/tickets] sendNewTicketEmailToAdmin", error);
  }

  return NextResponse.json({ success: true, ticket: inserted });
}
