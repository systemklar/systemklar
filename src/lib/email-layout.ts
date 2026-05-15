export const EMAIL_SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://systemklar.dk";

/**
 * Outlook/Gmail-kompatibel email-wrapper.
 * Bruger ren tabel-baseret layout med inline-styles — ingen flexbox, ingen
 * background-shorthand, ingen CSS-klasser. Alle email-templates wrappes med denne.
 *
 * `content` skal være HTML der lever inde i body-cellen (typisk h2 + p + button).
 */
export function emailOuterHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>systemklar</title>
</head>
<body style="margin:0;padding:0;background:#F0F7FF;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F0F7FF;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0A6EBD,#062840);background-color:#0A6EBD;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td>
                  <img
                    src="${EMAIL_SITE}/logo.png"
                    alt="systemklar logo"
                    width="24"
                    height="24"
                    style="display:block;width:24px;height:24px;object-fit:contain;filter:brightness(0) invert(1);"
                  />
                </td>
                <td style="width:10px;">&nbsp;</td>
                <td style="color:#ffffff;font-size:20px;font-weight:700;font-family:Inter,Arial,sans-serif;vertical-align:middle;letter-spacing:-0.3px;">systemklar</td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:8px 0 0 0;font-family:Arial,sans-serif;">
              IT-platform til danske virksomheder
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #D0E8F5;border-top:none;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#F0F7FF;padding:16px 32px;border-radius:0 0 16px 16px;border:1px solid #D0E8F5;border-top:none;text-align:center;">
            <p style="color:#7AAEC8;font-size:12px;margin:0 0 4px 0;font-family:Arial,sans-serif;">
              systemklar · CVR 46431596 · kontakt@systemklar.dk
            </p>
            <p style="margin:0;">
              <a href="${EMAIL_SITE}/privatlivspolitik" style="color:#7AAEC8;font-size:11px;font-family:Arial,sans-serif;text-decoration:none;">Privatlivspolitik</a>
              &nbsp;·&nbsp;
              <a href="${EMAIL_SITE}/vilkaar" style="color:#7AAEC8;font-size:11px;font-family:Arial,sans-serif;text-decoration:none;">Vilkår</a>
              &nbsp;·&nbsp;
              <a href="${EMAIL_SITE}/kontakt" style="color:#7AAEC8;font-size:11px;font-family:Arial,sans-serif;text-decoration:none;">Kontakt os</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
