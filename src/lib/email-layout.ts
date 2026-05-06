export const EMAIL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://systemklar.dk";

/**
 * Logo og footer er tabeller (Outlook/Gmail-kompatibelt) — ikke SVG.
 * DB-rækker i `email_templates` indeholder kun subject/body; "Nulstil" i admin påvirker ikke denne wrapper.
 * Ved deploy af layout: ingen SQL nødvendig — kør kun migrations der eksplicit ændrer seed/data.
 */
const EMAIL_HEADER_LOGO_AND_TAGLINE = `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td style="background:#ffffff; border-radius:8px; padding:6px 8px; display:inline-block;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:10px; height:10px; background:#0A6EBD; border-radius:2px; font-size:0;">&nbsp;</td>
                <td style="width:3px;">&nbsp;</td>
                <td style="width:10px; height:10px; background:#4FA8E0; border-radius:2px; font-size:0;">&nbsp;</td>
              </tr>
              <tr><td colspan="3" style="height:3px;">&nbsp;</td></tr>
              <tr>
                <td style="width:10px; height:10px; background:#4FA8E0; border-radius:2px; font-size:0;">&nbsp;</td>
                <td style="width:3px;">&nbsp;</td>
                <td style="width:10px; height:10px; background:#0A6EBD; border-radius:2px; font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
          <td style="width:8px;">&nbsp;</td>
          <td style="color:#ffffff; font-size:20px; font-weight:700; font-family:Inter,Arial,sans-serif; vertical-align:middle;">systemklar</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p style="color:rgba(255,255,255,0.7); font-size:12px; margin:8px 0 0 0; font-family:Inter,Arial,sans-serif;">
  IT-platform til danske virksomheder
</p>
`;

/** Ydre HTML-grid om email-indhold (marketing-header + footer). Bruges af send-flow og admin-preview. */
export function emailOuterHtml(innerContent: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0D1F2D;">
      <div style="background: linear-gradient(135deg, #0A6EBD, #062840); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        ${EMAIL_HEADER_LOGO_AND_TAGLINE}
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #D0E8F5; border-top: none;">
        ${innerContent}
      </div>
      <div style="background: #F0F7FF; padding: 16px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #D0E8F5; border-top: none;">
        <p style="color: #7AAEC8; font-size: 12px; margin: 0;">
          systemklar · CVR 46431596 ·
          <a href="${EMAIL_SITE}/privatlivspolitik" style="color: #7AAEC8;">Privatlivspolitik</a>
        </p>
      </div>
    </div>
  `;
}
