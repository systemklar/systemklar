import { NextResponse } from "next/server";
import { emailOuterHtml } from "@/lib/email-layout";
import { escapeHtml, getAppOrigin } from "@/lib/resend-welcome-email";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { getResend, FROM } from "@/lib/email";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const { data: report, error: repErr } = await admin
    .from("it_reports")
    .select("id, organisation_id, title, period_start, period_end, status")
    .eq("id", id)
    .maybeSingle();

  if (repErr) {
    return NextResponse.json({ error: repErr.message }, { status: 400 });
  }
  if (!report) {
    return NextResponse.json({ error: "Rapport ikke fundet." }, { status: 404 });
  }

  const { data: org } = await admin
    .from("organisations")
    .select("name")
    .eq("id", report.organisation_id as string)
    .maybeSingle();
  const orgName = String((org as { name?: string } | null)?.name ?? "din organisation");

  const end = new Date(String((report as { period_end?: string }).period_end));
  const monthLabel = Number.isNaN(end.getTime())
    ? String((report as { period_end?: string }).period_end ?? "")
    : end.toLocaleDateString("da-DK", { month: "long", year: "numeric" });

  const subject = `Din IT-rapport for ${monthLabel} er klar i Systemklar`;
  const portalBase = getAppOrigin();
  const rapportUrl = `${portalBase}/portal/rapport`;

  const { data: members, error: memErr } = await admin
    .from("profiles")
    .select("email, full_name, user_id")
    .eq("organisation_id", report.organisation_id as string)
    .not("user_id", "is", null);

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 400 });
  }

  const recipients = (members ?? []).filter((m) => {
    const em = (m as { email?: string }).email?.trim();
    return Boolean(em);
  }) as { email: string; full_name: string | null }[];

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Ingen modtagere med email på organisationen." }, { status: 400 });
  }

  try {
    const resend = getResend();
    for (const r of recipients) {
      const to = r.email.trim();
      const name = (r.full_name ?? "").trim() || "der";
      const bodyInner = `
    <p>Hej ${escapeHtml(name)},</p>
    <p>Vi har udarbejdet jeres IT-statusrapport for <strong>${escapeHtml(orgName)}</strong> (${escapeHtml(monthLabel)}). Den ligger klar i jeres Systemklar-portal.</p>
    <p><a href="${rapportUrl}" style="color:#0A6EBD;font-weight:600;">Åbn IT-rapporter i portalen</a></p>
    <p>Har I spørgsmål, er I velkomne til at skrive til os på <a href="mailto:kontakt@systemklar.dk">kontakt@systemklar.dk</a>.</p>
    <p style="margin-top:24px;">Venlig hilsen<br/>Systemklar IT</p>
  `;
      await resend.emails.send({
        from: FROM,
        to,
        subject,
        html: emailOuterHtml(bodyInner),
      });
    }
  } catch (e) {
    console.error("[it-reports/send] email", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kunne ikke sende e-mail." },
      { status: 500 },
    );
  }

  const { error: updErr } = await admin
    .from("it_reports")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}