import { NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml, getResendFromAddress } from "@/lib/resend-welcome-email";

type DemoRequestBody = {
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  employees?: string;
  message?: string;
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

  const payload = body as Partial<DemoRequestBody>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const companyName = typeof payload.companyName === "string" ? payload.companyName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const employees = typeof payload.employees === "string" ? payload.employees.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!name || !companyName || !email) {
    return NextResponse.json({ error: "Navn, virksomhedsnavn og email er påkrævet." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email er ugyldig." }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY mangler." }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const subject = `Ny demo-anmodning fra ${companyName}`;
  const html = `
    <h2>Ny demo-anmodning</h2>
    <p><strong>Navn:</strong> ${escapeHtml(name)}</p>
    <p><strong>Virksomhedsnavn:</strong> ${escapeHtml(companyName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telefonnummer:</strong> ${escapeHtml(phone || "-")}</p>
    <p><strong>Antal ansatte:</strong> ${escapeHtml(employees || "-")}</p>
    <p><strong>Besked / hvad ønsker de at se:</strong></p>
    <p style="white-space:pre-wrap;border-left:3px solid #1D9E75;padding-left:12px;">
      ${escapeHtml(message || "-")}
    </p>
  `;

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: "kontakt@systemklar.dk",
    subject,
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
    message: "Tak! Vi kontakter dig inden for 24 timer.",
  });
}
