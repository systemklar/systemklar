import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import {
  buildItReportHtmlDocument,
  IT_REPORTS_TABLE_COLUMNS,
  parseItReportContent,
  periodLabelDa,
} from "@/lib/it-reports";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: report, error } = await admin
    .from("it_reports")
    .select(IT_REPORTS_TABLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!report) {
    return NextResponse.json({ error: "Rapport ikke fundet." }, { status: 404 });
  }

  const status = String((report as { status?: string }).status ?? "");
  const orgId = String((report as { organisation_id?: string }).organisation_id ?? "");

  const adminUser = isAdminEmail(user.email);
  if (!adminUser) {
    if (status !== "sent") {
      return NextResponse.json({ error: "Rapporten er ikke tilgængelig endnu." }, { status: 403 });
    }
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("organisation_id")
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();
    if (pErr || !profile?.organisation_id || profile.organisation_id !== orgId) {
      return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
    }
  }

  const content = parseItReportContent((report as { content?: unknown }).content);
  if (!content) {
    return NextResponse.json({ error: "Ugyldigt rapportindhold." }, { status: 500 });
  }

  const period_start = String((report as { period_start?: string }).period_start ?? "");
  const period_end = String((report as { period_end?: string }).period_end ?? "");
  const periodLabel = periodLabelDa(period_start, period_end);
  const ai_summary = String((report as { ai_summary?: string | null }).ai_summary ?? "");
  const ai_recommendations = String((report as { ai_recommendations?: string | null }).ai_recommendations ?? "");

  const html = buildItReportHtmlDocument({
    organisationName: content.organisationName,
    periodLabel,
    aiSummary: ai_summary,
    aiRecommendations: ai_recommendations,
    content,
    forPrint: true,
  });

  const filename = `it-rapport-${id.slice(0, 8)}.html`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
