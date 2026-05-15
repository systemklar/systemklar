import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

type ContactBody = {
  name: string;
  company?: string;
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
  const company = typeof payload.company === "string" ? payload.company.trim() : "";
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

  try {
    await sendContactEmail(
      "kontakt@systemklar.dk",
      name,
      company || subject || "-",
      email,
      phone,
      message
    );
  } catch (error) {
    console.error("[api/contact] sendContactEmail", error);
  }

  return NextResponse.json({
    ok: true,
    message: "Tak! Din besked er sendt — vi vender tilbage hurtigst muligt.",
  });
}
