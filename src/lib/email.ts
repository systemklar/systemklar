import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "systemklar <kontakt@systemklar.dk>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://systemklar.dk";

function baseTemplate(content: string) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0D1F2D;">
      <div style="background: linear-gradient(135deg, #0A6EBD, #062840); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        <svg width="32" height="32" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;">
          <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#ffffff"/>
          <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#4FA8E0"/>
          <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#4FA8E0"/>
          <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#ffffff"/>
        </svg>
        <span style="color: white; font-size: 20px; font-weight: 700; margin-left: 10px; vertical-align: middle;">systemklar</span>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #D0E8F5; border-top: none;">
        ${content}
      </div>
      <div style="background: #F0F7FF; padding: 16px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #D0E8F5; border-top: none;">
        <p style="color: #7AAEC8; font-size: 12px; margin: 0;">
          systemklar · CVR 46431596 ·
          <a href="${SITE}/privatlivspolitik" style="color: #7AAEC8;">Privatlivspolitik</a>
        </p>
      </div>
    </div>
  `;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block; background:#0A6EBD; color:white; padding:12px 28px; border-radius:999px; text-decoration:none; font-weight:600; font-size:14px; margin:16px 0;">${text}</a>`;
}

export async function sendWelcomeEmail(to: string, name: string, orgName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Velkommen til systemklar, ${name}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Velkommen til systemklar</h2>
      <p>Hej ${name},</p>
      <p>Din profil for <strong>${orgName}</strong> er nu klar. Du kan logge ind og komme i gang med det samme.</p>
      ${btn("Gå til portalen", `${SITE}/portal`)}
      <p style="color:#4A8CB5; font-size:13px;">Har du spørgsmål? Skriv til os på <a href="mailto:kontakt@systemklar.dk" style="color:#0A6EBD;">kontakt@systemklar.dk</a></p>
    `),
  });
}

export async function sendNewTicketEmailToAdmin(
  ticketTitle: string,
  orgName: string,
  createdBy: string,
  ticketId: string
) {
  return resend.emails.send({
    from: FROM,
    to: "kontakt@systemklar.dk",
    subject: `Ny sag fra ${orgName}: ${ticketTitle}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Ny supportssag</h2>
      <p><strong>Virksomhed:</strong> ${orgName}</p>
      <p><strong>Oprettet af:</strong> ${createdBy}</p>
      <p><strong>Emne:</strong> ${ticketTitle}</p>
      ${btn("Se sagen i admin", `${SITE}/admin/tickets/${ticketId}`)}
    `),
  });
}

export async function sendTicketReplyEmail(
  to: string,
  name: string,
  ticketTitle: string,
  ticketId: string,
  preview: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Nyt svar på din sag: ${ticketTitle}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Du har fået et svar</h2>
      <p>Hej ${name},</p>
      <p>Vi har svaret på din sag <strong>${ticketTitle}</strong>:</p>
      <div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">
        ${preview}
      </div>
      ${btn("Se svaret", `${SITE}/portal/support/${ticketId}`)}
    `),
  });
}

export async function sendTicketClosedEmail(
  to: string,
  name: string,
  ticketTitle: string,
  ticketId: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Sag løst: ${ticketTitle}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Din sag er løst</h2>
      <p>Hej ${name},</p>
      <p>Vi har markeret sagen <strong>${ticketTitle}</strong> som løst.</p>
      <p>Har du stadig problemer? Svar på denne email eller opret en ny sag i portalen.</p>
      ${btn("Se sagen", `${SITE}/portal/support/${ticketId}`)}
    `),
  });
}

export async function sendMonthlyReportEmail(
  to: string,
  name: string,
  orgName: string,
  reportId: string,
  month: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Din IT-rapport for ${month} er klar`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">IT-rapport klar</h2>
      <p>Hej ${name},</p>
      <p>Din månedlige IT-rapport for <strong>${orgName}</strong> for ${month} er nu klar.</p>
      <p>Rapporten giver dig et overblik over drift, hændelser og anbefalinger for måneden.</p>
      ${btn("Se rapporten", `${SITE}/portal/rapport/${reportId}`)}
    `),
  });
}

export async function sendInviteEmail(
  to: string,
  contactName: string,
  orgName: string,
  inviteUrl: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Du er inviteret til ${orgName} på systemklar`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Du er inviteret til systemklar</h2>
      <p>Hej ${contactName},</p>
      <p>Du er blevet inviteret til at få adgang til <strong>${orgName}</strong> på systemklar – en IT-platform der samler support, overblik og dokumentation ét sted.</p>
      <p>Klik på knappen nedenfor for at oprette din profil. Det tager under 2 minutter.</p>
      ${btn("Opret din profil", inviteUrl)}
      <p style="color:#4A8CB5; font-size:13px;">Linket udløber om 7 dage. Har du spørgsmål? Skriv til os på <a href="mailto:kontakt@systemklar.dk" style="color:#0A6EBD;">kontakt@systemklar.dk</a></p>
    `),
  });
}

export async function sendBookDemoEmail(
  to: string,
  name: string,
  company: string,
  message: string
) {
  return resend.emails.send({
    from: FROM,
    to: "kontakt@systemklar.dk",
    subject: `Demo-forespørgsel fra ${name} – ${company}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Ny demo-forespørgsel</h2>
      <p><strong>Navn:</strong> ${name}</p>
      <p><strong>Virksomhed:</strong> ${company}</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Besked:</strong></p>
      <div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">
        ${message || "Ingen besked"}
      </div>
      ${btn("Svar på forespørgsel", `mailto:${to}`)}
    `),
  });
}

export async function sendContactEmail(
  to: string,
  name: string,
  company: string,
  email: string,
  phone: string,
  message: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Ny henvendelse fra ${name} – ${company}`,
    html: baseTemplate(`
      <h2 style="margin-top:0;">Ny kontakthenvendelse</h2>
      <p><strong>Navn:</strong> ${name}</p>
      <p><strong>Virksomhed:</strong> ${company}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#0A6EBD;">${email}</a></p>
      ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ""}
      <p><strong>Besked:</strong></p>
      <div style="background:#F0F7FF; border-left:3px solid #0A6EBD; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#2C4A5E; font-size:14px;">
        ${message}
      </div>
      ${btn("Svar på henvendelse", `mailto:${email}`)}
    `),
  });
}
