import { Resend } from "resend";
import { escapeHtml, getAppOrigin, getResendFromAddress } from "@/lib/resend-welcome-email";

export type QuoteEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

/**
 * Sender tilbud til kundens profil-e-mail med link til portalen.
 */
export async function sendQuoteEmail(params: {
  toEmail: string;
  companyName: string;
  quoteTitle: string;
  quoteId: string;
  contentPreview: string;
}): Promise<QuoteEmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[sendQuoteEmail] RESEND_API_KEY mangler");
    return { ok: false, error: "RESEND_API_KEY er ikke sat." };
  }

  const resend = new Resend(resendKey);
  const from = getResendFromAddress();
  const origin = getAppOrigin();
  const link = `${origin}/portal/tilbud/${params.quoteId}`;

  const preview =
    params.contentPreview.trim().length > 400
      ? `${params.contentPreview.trim().slice(0, 400)}…`
      : params.contentPreview.trim();

  const htmlBody = `
    <p>Hej ${escapeHtml(params.companyName)},</p>
    <p>Du har modtaget et tilbud fra <strong>Systemklar</strong>: <strong>${escapeHtml(params.quoteTitle)}</strong>.</p>
    <p style="white-space:pre-wrap;border-left:3px solid #1D9E75;padding-left:12px;margin:16px 0;color:#334155;">${escapeHtml(preview)}</p>
    <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#1D9E75;color:#fff;padding:10px 18px;border-radius:9999px;text-decoration:none;font-weight:600;">Åbn tilbud i kundeportalen</a></p>
    <p class="text-slate-500" style="font-size:13px;">Eller kopier dette link: <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
    <p>Med venlig hilsen<br/>Systemklar</p>
  `;

  const { data, error } = await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Tilbud: ${params.quoteTitle}`,
    html: htmlBody,
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);
    console.error("[sendQuoteEmail] failed", { to: params.toEmail, error });
    return { ok: false, error: msg };
  }

  return { ok: true, messageId: data?.id };
}
