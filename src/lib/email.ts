import { Resend } from "resend";
import {
  EMAIL_TEMPLATE_FALLBACK_RECORD,
  type EmailTemplateId,
} from "@/lib/email-template-defaults";
import { EMAIL_SITE, emailOuterHtml } from "@/lib/email-layout";
import { escapeHtml } from "@/lib/resend-welcome-email";

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');
  }
  return new Resend(key);
}

export const FROM = process.env.RESEND_FROM_EMAIL ?? "systemklar <noreply@systemklar.dk>";
export const SITE = EMAIL_SITE;

/**
 * Samme som `emailOuterHtml` — alle send-funktioner wrapper body med denne (Outlook/Gmail-venlig header).
 * @deprecated Brug `emailOuterHtml` til nye imports.
 */
export const baseTemplate = emailOuterHtml;

/** Knap til HTML-mails — tabel-layout for bedre klient-understøttelse. */
export function btn(text: string, url: string) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background:#0A6EBD; border-radius:999px; padding:12px 28px;">
          <a href="${url}" style="color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; font-family:Inter,Arial,sans-serif; display:inline-block;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function getTemplate(id: EmailTemplateId): Promise<{ subject: string; body: string }> {
  const fb = EMAIL_TEMPLATE_FALLBACK_RECORD[id];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("email_templates").select("subject, body").eq("id", id).maybeSingle();
    if (data?.subject?.trim() && data?.body?.trim()) {
      return { subject: data.subject, body: data.body };
    }
  } catch {
    /* ignore */
  }
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase-service-role");
    const admin = createServiceRoleClient();
    if (admin) {
      const { data } = await admin.from("email_templates").select("subject, body").eq("id", id).maybeSingle();
      if (data?.subject?.trim() && data?.body?.trim()) {
        return { subject: data.subject, body: data.body };
      }
    }
  } catch {
    /* ignore */
  }
  return fb ?? { subject: "", body: "" };
}

export async function sendWelcomeEmail(to: string, name: string, orgName: string) {
  const template = await getTemplate("welcome");
  const portalButton = btn("Gå til portalen", `${SITE}/portal`);
  const vars = {
    name: escapeHtml(name),
    orgName: escapeHtml(orgName),
    portalButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendNewTicketEmailToAdmin(
  ticketTitle: string,
  orgName: string,
  createdBy: string,
  ticketId: string
) {
  const template = await getTemplate("new_ticket_admin");
  const adminButton = btn("Se sagen i admin", `${SITE}/admin/tickets/${ticketId}`);
  const vars = {
    orgName: escapeHtml(orgName),
    createdBy: escapeHtml(createdBy),
    ticketTitle: escapeHtml(ticketTitle),
    adminButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to: "kontakt@systemklar.dk",
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendTicketReplyEmail(
  to: string,
  name: string,
  ticketTitle: string,
  ticketId: string,
  preview: string
) {
  const template = await getTemplate("ticket_reply");
  const ticketButton = btn("Se svaret", `${SITE}/portal/support/${ticketId}`);
  const vars = {
    name: escapeHtml(name),
    ticketTitle: escapeHtml(ticketTitle),
    messagePreview: escapeHtml(preview),
    ticketButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendTicketClosedEmail(
  to: string,
  name: string,
  ticketTitle: string,
  ticketId: string
) {
  const template = await getTemplate("ticket_closed");
  const ticketButton = btn("Se sagen", `${SITE}/portal/support/${ticketId}`);
  const vars = {
    name: escapeHtml(name),
    ticketTitle: escapeHtml(ticketTitle),
    ticketButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendMonthlyReportEmail(
  to: string,
  name: string,
  orgName: string,
  reportId: string,
  month: string
) {
  const template = await getTemplate("monthly_report");
  const reportButton = btn("Se rapporten", `${SITE}/portal/rapport/${reportId}`);
  const vars = {
    name: escapeHtml(name),
    orgName: escapeHtml(orgName),
    month: escapeHtml(month),
    reportButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendInviteEmail(
  to: string,
  contactName: string,
  orgName: string,
  inviteUrl: string
) {
  const template = await getTemplate("invite");
  const inviteButton = btn("Opret din profil", inviteUrl);
  const vars = {
    contactName: escapeHtml(contactName),
    orgName: escapeHtml(orgName),
    inviteButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);

  const text = [
    `Hej ${contactName},`,
    "",
    `Du er blevet inviteret til at få adgang til ${orgName} på systemklar — en IT-platform der samler support, overblik og dokumentation ét sted.`,
    "",
    "Klik på linket nedenfor for at oprette din profil. Det tager under 2 minutter:",
    inviteUrl,
    "",
    "Linket udløber om 7 dage.",
    "Har du spørgsmål? Skriv til os på kontakt@systemklar.dk",
    "",
    "—",
    "systemklar · CVR 46431596 · kontakt@systemklar.dk",
  ].join("\n");

  let refId = inviteUrl;
  try {
    const parsed = new URL(inviteUrl);
    refId = parsed.searchParams.get("token") ?? inviteUrl;
  } catch {
    /* behold inviteUrl som ref */
  }

  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailOuterHtml(bodyInner),
    text,
    replyTo: "kontakt@systemklar.dk",
    headers: {
      "X-Entity-Ref-ID": refId,
      "List-Unsubscribe": "<mailto:kontakt@systemklar.dk?subject=unsubscribe>",
    },
  });
}

export async function sendBookDemoEmail(
  to: string,
  name: string,
  company: string,
  message: string
) {
  const template = await getTemplate("book_demo");
  const replyButton = btn("Svar på forespørgsel", `mailto:${to}`);
  const vars = {
    name: escapeHtml(name),
    company: escapeHtml(company),
    email: escapeHtml(to),
    message: escapeHtml(message || "Ingen besked"),
    replyButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to: "kontakt@systemklar.dk",
    subject,
    html: emailOuterHtml(bodyInner),
  });
}

export async function sendContactEmail(
  toRecipient: string,
  name: string,
  company: string,
  email: string,
  phone: string,
  message: string
) {
  const template = await getTemplate("contact");
  const replyButton = btn("Svar på henvendelse", `mailto:${email}`);
  const vars = {
    name: escapeHtml(name),
    company: escapeHtml(company),
    email: escapeHtml(email),
    phone: escapeHtml(phone || "—"),
    message: escapeHtml(message),
    replyButton,
  };
  const subject = interpolate(template.subject, vars);
  const bodyInner = interpolate(template.body, vars);
  return getResend().emails.send({
    from: FROM,
    to: toRecipient,
    subject,
    html: emailOuterHtml(bodyInner),
  });
}
