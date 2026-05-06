/**
 * Standardskabeloner (samme indhold som DB seed / FALLBACK til email-send).
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

export const DEFAULT_EMAIL_TEMPLATE_ROWS: readonly EmailTemplateDefaultRow[] = [
  {
    id: "invite",
    name: "Invitations-email",
    description: "Sendes når admin eller organisation inviterer en ny bruger.",
    subject: "Du er inviteret til {{orgName}} på systemklar",
    body: `<h2 style="margin-top:0;">Du er inviteret til systemklar</h2>
<p>Hej {{contactName}},</p>
<p>Du er blevet inviteret til at få adgang til <strong>{{orgName}}</strong> på systemklar – en IT-platform der samler support, overblik og dokumentation ét sted.</p>
<p>Klik på knappen nedenfor for at oprette din profil. Det tager under 2 minutter.</p>
<p>{{inviteButton}}</p>
<p style="color:#4A8CB5; font-size:13px;">Linket udløber om 7 dage. Har du spørgsmål? Skriv til os på kontakt@systemklar.dk</p>`,
    variables: ["contactName", "orgName", "inviteButton"],
  },
  {
    id: "welcome",
    name: "Velkomst-email",
    description: "Sendes kort efter at bruger har accepteret invitation og oprettet profil.",
    subject: "Velkommen til systemklar, {{name}}",
    body: `<h2 style="margin-top:0;">Velkommen til systemklar</h2>
<p>Hej {{name}},</p>
<p>Din profil for <strong>{{orgName}}</strong> er nu klar. Du kan logge ind og komme i gang med det samme.</p>
<p>{{portalButton}}</p>
<p style="color:#4A8CB5; font-size:13px;">Har du spørgsmål? Skriv til os på kontakt@systemklar.dk</p>`,
    variables: ["name", "orgName", "portalButton"],
  },
  {
    id: "ticket_reply",
    name: "Svar på supportssag",
    description: "Til kunde når support har skrevet en ny besked på sagen.",
    subject: "Nyt svar på din sag: {{ticketTitle}}",
    body: `<h2 style="margin-top:0;">Du har fået et svar</h2>
<p>Hej {{name}},</p>
<p>Vi har svaret på din sag <strong>{{ticketTitle}}</strong>:</p>
<div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">{{messagePreview}}</div>
<p>{{ticketButton}}</p>`,
    variables: ["name", "ticketTitle", "messagePreview", "ticketButton"],
  },
  {
    id: "ticket_closed",
    name: "Sag lukket",
    description: "Til kunde når sagen markeres som løst.",
    subject: "Sag løst: {{ticketTitle}}",
    body: `<h2 style="margin-top:0;">Din sag er løst</h2>
<p>Hej {{name}},</p>
<p>Vi har markeret sagen <strong>{{ticketTitle}}</strong> som løst.</p>
<p>Har du stadig problemer? Svar på denne email eller opret en ny sag i portalen.</p>
<p>{{ticketButton}}</p>`,
    variables: ["name", "ticketTitle", "ticketButton"],
  },
  {
    id: "monthly_report",
    name: "Månedlig IT-rapport",
    description: "Til org-medlemmer der har aktiveret rapport-notifikation, når admin opretter rapport.",
    subject: "Din IT-rapport for {{month}} er klar",
    body: `<h2 style="margin-top:0;">IT-rapport klar</h2>
<p>Hej {{name}},</p>
<p>Din månedlige IT-rapport for <strong>{{orgName}}</strong> for {{month}} er nu klar.</p>
<p>Rapporten giver dig et overblik over drift, hændelser og anbefalinger for måneden.</p>
<p>{{reportButton}}</p>`,
    variables: ["name", "orgName", "month", "reportButton"],
  },
  {
    id: "new_ticket_admin",
    name: "Ny supportssag (intern)",
    description: "Til kontakt@systemklar.dk når kunde opretter ny sag.",
    subject: "Ny sag fra {{orgName}}: {{ticketTitle}}",
    body: `<h2 style="margin-top:0;">Ny supportssag</h2>
<p><strong>Virksomhed:</strong> {{orgName}}</p>
<p><strong>Oprettet af:</strong> {{createdBy}}</p>
<p><strong>Emne:</strong> {{ticketTitle}}</p>
<p>{{adminButton}}</p>`,
    variables: ["orgName", "createdBy", "ticketTitle", "adminButton"],
  },
  {
    id: "contact",
    name: "Kontaktformular",
    description: "Til kontakt@systemklar.dk fra marketing-kontaktformular.",
    subject: "Ny henvendelse fra {{name}} – {{company}}",
    body: `<h2 style="margin-top:0;">Ny kontakthenvendelse</h2>
<p><strong>Navn:</strong> {{name}}</p>
<p><strong>Virksomhed:</strong> {{company}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Telefon:</strong> {{phone}}</p>
<p><strong>Besked:</strong></p>
<div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">{{message}}</div>
<p>{{replyButton}}</p>`,
    variables: ["name", "company", "email", "phone", "message", "replyButton"],
  },
  {
    id: "book_demo",
    name: "Demo-forespørgsel",
    description: "Til kontakt@systemklar.dk når nogen booker demo.",
    subject: "Demo-forespørgsel fra {{name}} – {{company}}",
    body: `<h2 style="margin-top:0;">Ny demo-forespørgsel</h2>
<p><strong>Navn:</strong> {{name}}</p>
<p><strong>Virksomhed:</strong> {{company}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Besked:</strong></p>
<div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">{{message}}</div>
<p>{{replyButton}}</p>`,
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
