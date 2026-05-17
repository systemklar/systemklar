import { NextResponse } from "next/server";
import { emailOuterHtml } from "@/lib/email-layout";
import { escapeHtml, getAppOrigin } from "@/lib/resend-welcome-email";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { getResend, FROM } from "@/lib/email";
import { systemklarLogoPngAbsoluteUrl } from "@/lib/systemklar-logo-url";

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
    const logoUrl = escapeHtml(systemklarLogoPngAbsoluteUrl());
    for (const r of recipients) {
      const to = r.email.trim();
      const name = (r.full_name ?? "").trim() || "der";
      const bodyInner = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#1E3448;font-family:'DM Sans',Arial,sans-serif;">Hej ${escapeHtml(name)},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#4A6478;font-family:'DM Sans',Arial,sans-serif;">Vi har udarbejdet jeres IT-statusrapport for <strong style="color:#1E3448;">${escapeHtml(orgName)}</strong> (${escapeHtml(monthLabel)}). Den ligger klar i jeres Systemklar-portal.</p>
    <p style="margin:0 0 16px;"><a href="${rapportUrl}" style="display:inline-block;padding:10px 20px;border-radius:9999px;background:#4A7FA5;color:#ffffff;font-weight:600;font-size:14px;font-family:'DM Sans',Arial,sans-serif;text-decoration:none;">Åbn IT-rapporter i portalen</a></p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#4A6478;font-family:'DM Sans',Arial,sans-serif;">Har I spørgsmål, er I velkomne til at skrive til os på <a href="mailto:kontakt@systemklar.dk" style="color:#4A7FA5;font-weight:600;">kontakt@systemklar.dk</a>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border:1px solid #1E3448;border-radius:16px;">
      <tr>
        <td style="padding:24px;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;width:99%;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;color:#5A9A6A;font-size:22px;line-height:1.2;font-weight:700;">&#10003;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1E3448;">Personligt gennemgået af Systemklar</p>
                      <p style="margin:0;font-size:12px;line-height:1.55;color:#4A6478;">Denne rapport er udarbejdet på baggrund af data fra dit IT-miljø og er gennemgået og godkendt af Systemklar inden udsendelse. Vi står altid klar til at hjælpe hvis du har spørgsmål.</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:16px;">
                <table cellpadding="0" cellspacing="0" border="0" align="right" style="margin-left:auto;">
                  <tr>
                    <td style="vertical-align:middle;padding:0;">
                      <img src="${logoUrl}" alt="" width="120" height="28" style="display:block;height:28px;width:auto;" />
                    </td>
                    <td style="vertical-align:middle;padding:0;padding-left:8px;">
                      <span style="font-size:18px;font-weight:700;color:#4A7FA5;font-family:'DM Sans',Arial,sans-serif;letter-spacing:-0.02em;text-transform:lowercase;">systemklar</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:6px 0 0;font-size:12px;color:#7A9AB0;font-family:'DM Sans',Arial,sans-serif;">systemklar.dk</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#7A9AB0;font-family:'DM Sans',Arial,sans-serif;text-transform:lowercase;">Venlig hilsen<br/><span style="font-weight:700;color:#4A7FA5;">systemklar</span></p>
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