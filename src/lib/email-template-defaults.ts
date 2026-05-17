/**
 * Standardskabeloner (samme indhold som DB seed / FALLBACK til email-send).
 *
 * Bodies bruger udelukkende inline styles (ingen CSS-klasser), da Gmail/Outlook
 * stripper <style> og class-attributter. Wrappes af `emailOuterHtml` i email-layout.ts.
 */

export type EmailTemplateId =
  | "invite"
  | "welcome"
  | "ticket_reply"
  | "ticket_closed"
  | "monthly_report"
  | "new_ticket_admin"
  | "contact"
  | "book_demo";

export type EmailTemplateDefaultRow = {
  id: EmailTemplateId;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: readonly string[];
};

const STYLE_H2 =
  "margin:0 0 16px 0;font-size:22px;font-weight:700;color:#1E3448;font-family:'DM Sans',Arial,sans-serif;";
const STYLE_P =
  "margin:0 0 12px 0;font-size:15px;color:#4A6478;line-height:1.6;font-family:Arial,sans-serif;";
const STYLE_P_LAST =
  "margin:0 0 20px 0;font-size:15px;color:#4A6478;line-height:1.6;font-family:Arial,sans-serif;";
const STYLE_P_INFO =
  "margin:0 0 8px 0;font-size:14px;color:#4A6478;line-height:1.6;font-family:Arial,sans-serif;";
const STYLE_P_HELP =
  "margin:16px 0 0 0;font-size:13px;color:#4A6478;line-height:1.6;font-family:Arial,sans-serif;";
const STYLE_STRONG_DARK = "color:#1E3448;";
const STYLE_LINK = "color:#4A7FA5;text-decoration:none;";
const STYLE_QUOTE =
  "background:#EAF1F7;border-left:3px solid #4A7FA5;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;color:#4A6478;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;";

export const DEFAULT_EMAIL_TEMPLATE_ROWS: readonly EmailTemplateDefaultRow[] = [
  {
    id: "invite",
    name: "Invitations-email",
    description: "Sendes når admin eller organisation inviterer en ny bruger.",
    subject: "Du er inviteret til {{orgName}} på systemklar",
    body: `<h2 style="${STYLE_H2}">Du er inviteret til systemklar</h2>
<p style="${STYLE_P}">Hej {{contactName}},</p>
<p style="${STYLE_P_LAST}">Du er blevet inviteret til at få adgang til <strong style="${STYLE_STRONG_DARK}">{{orgName}}</strong> på systemklar — en IT-platform der samler support, overblik og dokumentation ét sted.</p>
<p style="${STYLE_P_LAST}">Klik på knappen nedenfor for at oprette din profil. Det tager under 2 minutter.</p>
{{inviteButton}}
<p style="${STYLE_P_HELP}">Linket udløber om 7 dage. Har du spørgsmål? Skriv til os på <a href="mailto:kontakt@systemklar.dk" style="${STYLE_LINK}">kontakt@systemklar.dk</a></p>`,
    variables: ["contactName", "orgName", "inviteButton"],
  },
  {
    id: "welcome",
    name: "Velkomst-email",
    description: "Sendes kort efter at bruger har accepteret invitation og oprettet profil.",
    subject: "Velkommen til systemklar, {{name}}",
    body: `<h2 style="${STYLE_H2}">Velkommen til systemklar</h2>
<p style="${STYLE_P}">Hej {{name}},</p>
<p style="${STYLE_P_LAST}">Din profil for <strong style="${STYLE_STRONG_DARK}">{{orgName}}</strong> er nu klar. Log ind og kom i gang med det samme.</p>
{{portalButton}}
<p style="${STYLE_P_HELP}">Har du spørgsmål? Skriv til os på <a href="mailto:kontakt@systemklar.dk" style="${STYLE_LINK}">kontakt@systemklar.dk</a></p>`,
    variables: ["name", "orgName", "portalButton"],
  },
  {
    id: "ticket_reply",
    name: "Svar på supportsag",
    description: "Til kunde når support har skrevet en ny besked på sagen.",
    subject: "Nyt svar på din sag: {{ticketTitle}}",
    body: `<h2 style="${STYLE_H2}">Du har fået et svar</h2>
<p style="${STYLE_P}">Hej {{name}},</p>
<p style="${STYLE_P_LAST}">Vi har svaret på din sag <strong style="${STYLE_STRONG_DARK}">{{ticketTitle}}</strong>:</p>
<div style="${STYLE_QUOTE}">{{messagePreview}}</div>
{{ticketButton}}
<p style="${STYLE_P_HELP}">Du kan også svare direkte i portalen for at fortsætte samtalen.</p>`,
    variables: ["name", "ticketTitle", "ticketNumber", "messagePreview", "ticketButton"],
  },
  {
    id: "ticket_closed",
    name: "Sag lukket",
    description: "Til kunde når sagen markeres som løst.",
    subject: "Sag løst {{ticketNumber}}: {{ticketTitle}}",
    body: `<h2 style="${STYLE_H2}">Din sag er løst</h2>
<p style="${STYLE_P}">Hej {{name}},</p>
<p style="${STYLE_P_LAST}">Vi har markeret sagen <strong style="${STYLE_STRONG_DARK}">{{ticketTitle}}</strong> som løst.</p>
<p style="${STYLE_P_LAST}">Har du stadig problemer? Svar på denne email eller opret en ny sag i portalen.</p>
{{ticketButton}}
<p style="${STYLE_P_HELP}">Tak fordi du brugte systemklar.</p>`,
    variables: ["name", "ticketTitle", "ticketNumber", "ticketButton"],
  },
  {
    id: "monthly_report",
    name: "Månedlig IT-rapport",
    description: "Til org-medlemmer der har aktiveret rapport-notifikation, når admin opretter rapport.",
    subject: "Din IT-rapport for {{month}} er klar",
    body: `<h2 style="${STYLE_H2}">Din IT-rapport er klar</h2>
<p style="${STYLE_P}">Hej {{name}},</p>
<p style="${STYLE_P_LAST}">Din månedlige IT-rapport for <strong style="${STYLE_STRONG_DARK}">{{orgName}}</strong> for <strong style="${STYLE_STRONG_DARK}">{{month}}</strong> er nu klar.</p>
<p style="${STYLE_P_LAST}">Rapporten giver dig et overblik over drift, hændelser og anbefalinger for måneden.</p>
{{reportButton}}
<p style="${STYLE_P_HELP}">Har du spørgsmål til rapporten? Skriv til os på <a href="mailto:kontakt@systemklar.dk" style="${STYLE_LINK}">kontakt@systemklar.dk</a></p>`,
    variables: ["name", "orgName", "month", "reportButton"],
  },
  {
    id: "new_ticket_admin",
    name: "Ny supportsag (intern)",
    description: "Til kontakt@systemklar.dk når kunde opretter ny sag.",
    subject: "Ny sag {{ticketNumber}} fra {{orgName}}: {{ticketTitle}}",
    body: `<h2 style="${STYLE_H2}">Ny supportsag</h2>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Virksomhed:</strong> {{orgName}}</p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Oprettet af:</strong> {{createdBy}}</p>
<p style="margin:0 0 20px 0;font-size:14px;color:#4A6478;line-height:1.6;font-family:Arial,sans-serif;"><strong style="${STYLE_STRONG_DARK}">Emne:</strong> {{ticketTitle}}</p>
{{adminButton}}`,
    variables: ["orgName", "createdBy", "ticketTitle", "ticketNumber", "adminButton"],
  },
  {
    id: "contact",
    name: "Kontaktformular",
    description: "Til kontakt@systemklar.dk fra marketing-kontaktformular.",
    subject: "Ny henvendelse fra {{name}} – {{company}}",
    body: `<h2 style="${STYLE_H2}">Ny kontakthenvendelse</h2>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Navn:</strong> {{name}}</p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Virksomhed:</strong> {{company}}</p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Email:</strong> <a href="mailto:{{email}}" style="${STYLE_LINK}">{{email}}</a></p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Telefon:</strong> {{phone}}</p>
<p style="margin:16px 0 8px 0;font-size:14px;color:#4A6478;font-family:Arial,sans-serif;"><strong style="${STYLE_STRONG_DARK}">Besked:</strong></p>
<div style="${STYLE_QUOTE}">{{message}}</div>
{{replyButton}}`,
    variables: ["name", "company", "email", "phone", "message", "replyButton"],
  },
  {
    id: "book_demo",
    name: "Demo-forespørgsel",
    description: "Til kontakt@systemklar.dk når nogen booker demo.",
    subject: "Demo-forespørgsel fra {{name}} – {{company}}",
    body: `<h2 style="${STYLE_H2}">Ny demo-forespørgsel</h2>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Navn:</strong> {{name}}</p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Virksomhed:</strong> {{company}}</p>
<p style="${STYLE_P_INFO}"><strong style="${STYLE_STRONG_DARK}">Email:</strong> <a href="mailto:{{email}}" style="${STYLE_LINK}">{{email}}</a></p>
<p style="margin:16px 0 8px 0;font-size:14px;color:#4A6478;font-family:Arial,sans-serif;"><strong style="${STYLE_STRONG_DARK}">Besked:</strong></p>
<div style="${STYLE_QUOTE}">{{message}}</div>
{{replyButton}}`,
    variables: ["name", "company", "email", "message", "replyButton"],
  },
] as const;

export const EMAIL_TEMPLATE_FALLBACK_RECORD: Record<EmailTemplateId, { subject: string; body: string }> =
  DEFAULT_EMAIL_TEMPLATE_ROWS.reduce((acc, row) => {
    acc[row.id] = { subject: row.subject, body: row.body };
    return acc;
  }, {} as Record<EmailTemplateId, { subject: string; body: string }>);

export function getDescriptionForTemplateId(id: string): string {
  const row = DEFAULT_EMAIL_TEMPLATE_ROWS.find((r) => r.id === id);
  return row?.description ?? "";
}
