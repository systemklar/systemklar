import { Resend } from "resend";
import { emailOuterHtml } from "@/lib/email-layout";
import { escapeHtml } from "@/lib/escape-html";

export { escapeHtml };

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "noreply@systemklar.dk";
}

export type WelcomeEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

/**
 * Velkomstmail (HTML) efter Supabase-invite — samme indhold som tidligere invite-endpoint.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  companyName: string
): Promise<WelcomeEmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[sendWelcomeEmail] RESEND_API_KEY mangler");
    return { ok: false, error: "RESEND_API_KEY er ikke sat." };
  }

  const resend = new Resend(resendKey);
  const from = getResendFromAddress();
  const portalUrl = `${getAppOrigin()}/portal`;
  const inner = `
        <p>Hej,</p>
        <p>Velkommen til <strong>systemklar</strong> – vi er glade for at have ${escapeHtml(
          companyName
        )} med.</p>
        <p>Du har modtaget en separat e-mail fra os med et link til at vælge adgangskode. Når du har sat adgangskoden, kan du logge ind på <a href="${portalUrl}">kundeportalen</a>.</p>
        <p>Med venlig hilsen<br/>systemklar</p>
      `;
  const htmlBody = emailOuterHtml(inner);

  console.log("[sendWelcomeEmail] attempt", {
    from,
    to: toEmail,
    subject: "Velkommen til systemklar",
  });

  const { data, error } = await resend.emails.send({
    from,
    to: toEmail,
    subject: "Velkommen til systemklar",
    html: htmlBody,
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);
    console.error("[sendWelcomeEmail] failed", { to: toEmail, error });
    return { ok: false, error: msg };
  }

  console.log("[sendWelcomeEmail] ok", { to: toEmail, messageId: data?.id ?? null });
  return { ok: true, messageId: data?.id };
}
