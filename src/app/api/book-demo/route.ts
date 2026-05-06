import { NextResponse } from "next/server";
import { sendBookDemoEmail } from "@/lib/email";

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

  try {
    const composedMessage = [message, phone ? `Telefon: ${phone}` : "", employees ? `Antal ansatte: ${employees}` : ""]
      .filter(Boolean)
      .join("\n");
    await sendBookDemoEmail(email, name, companyName, composedMessage);
  } catch (error) {
    console.error("[api/book-demo] sendBookDemoEmail", error);
  }

  return NextResponse.json({
    ok: true,
    message: "Tak! Vi kontakter dig inden for 24 timer.",
  });
}
