import { NextResponse } from "next/server";
import { sendMonthlyReportEmail } from "@/lib/email";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const user_id =
    typeof body === "object" && body !== null && "user_id" in body
      ? String((body as { user_id?: unknown }).user_id ?? "").trim()
      : "";
  const title =
    typeof body === "object" && body !== null && "title" in body
      ? String((body as { title?: unknown }).title ?? "").trim()
      : "";
  const period =
    typeof body === "object" && body !== null && "period" in body
      ? String((body as { period?: unknown }).period ?? "").trim()
      : "";
  const status_summary =
    typeof body === "object" && body !== null && "status_summary" in body
      ? String((body as { status_summary?: unknown }).status_summary ?? "")
      : "";
  const incidents =
    typeof body === "object" && body !== null && "incidents" in body
      ? String((body as { incidents?: unknown }).incidents ?? "")
      : "";
  const resolved =
    typeof body === "object" && body !== null && "resolved" in body
      ? String((body as { resolved?: unknown }).resolved ?? "")
      : "";
  const recommendations =
    typeof body === "object" && body !== null && "recommendations" in body
      ? String((body as { recommendations?: unknown }).recommendations ?? "")
      : "";

  if (!user_id || !title || !period) {
    return NextResponse.json({ error: "user_id, title og period er påkrævet." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await admin
    .from("reports")
    .insert({
      user_id,
      title,
      period,
      status_summary,
      incidents,
      resolved,
      recommendations,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "Kunne ikke oprette rapport." }, { status: 400 });
  }

  try {
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("organisation_id, company_name, email, full_name, notif_monthly_report")
      .eq("user_id", user_id)
      .maybeSingle();

    const orgId = (ownerProfile?.organisation_id as string | undefined) ?? null;
    const orgName = (ownerProfile?.company_name as string | undefined)?.trim() || "din organisation";
    if (orgId) {
      const { data: recipients } = await admin
        .from("profiles")
        .select("email, full_name, notif_monthly_report")
        .eq("organisation_id", orgId)
        .eq("notif_monthly_report", true);
      for (const recipient of recipients ?? []) {
        const email = (recipient.email as string | undefined)?.trim();
        if (!email) continue;
        await sendMonthlyReportEmail(
          email,
          ((recipient.full_name as string | undefined)?.trim() || "der"),
          orgName,
          inserted.id as string,
          period
        );
      }
    } else if (ownerProfile?.email && ownerProfile.notif_monthly_report !== false) {
      await sendMonthlyReportEmail(
        ownerProfile.email as string,
        (ownerProfile.full_name as string | undefined)?.trim() || "der",
        orgName,
        inserted.id as string,
        period
      );
    }
  } catch (error) {
    console.error("[api/admin/reports] sendMonthlyReportEmail", error);
  }

  return NextResponse.json({ success: true, id: inserted.id });
}
