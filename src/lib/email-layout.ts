export const EMAIL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://systemklar.dk";

/** Ydre HTML-grid om email-indhold (marketing-header + footer). Bruges af send-flow og admin-preview. */
export function emailOuterHtml(innerContent: string): string {
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
