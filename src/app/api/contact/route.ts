import { NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml, getResendFromAddress } from "@/lib/resend-welcome-email";

type ContactBody = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const payload = body as Partial<ContactBody>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const subjectRaw = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const subject = subjectRaw.slice(0, 200);
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Navn, email og besked er påkrævet." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email er ugyldig." }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY mangler." }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const mailSubject =
    subject || `Kontakt fra ${name}`;
  const html = `
    <h2>Kontaktforespørgsel</h2>
    <p><strong>Navn:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
    <p><strong>Emne:</strong> ${escapeHtml(subject || "-")}</p>
    <p><strong>Besked:</strong></p>
    <p style="white-space:pre-wrap;border-left:3px solid #2563eb;padding-left:12px;">
      ${escapeHtml(message)}
    </p>
  `;

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: "kontakt@systemklar.dk",
    subject: mailSubject,
    html,
    replyTo: email,
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Kunne ikke sende email.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: "Tak! Din besked er sendt — vi vender tilbage hurtigst muligt.",
  });
}
