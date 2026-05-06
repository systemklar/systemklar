import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email?: unknown }).email ?? "").trim()
      : "";
  const name =
    typeof body === "object" && body !== null && "name" in body
      ? String((body as { name?: unknown }).name ?? "").trim()
      : "";
  const orgName =
    typeof body === "object" && body !== null && "orgName" in body
      ? String((body as { orgName?: unknown }).orgName ?? "").trim()
      : "";

  if (!email || !name || !orgName) {
    return NextResponse.json({ error: "email, name og orgName er påkrævet." }, { status: 400 });
  }

  try {
    await sendWelcomeEmail(email, name, orgName);
  } catch (error) {
    console.error("[api/welcome] sendWelcomeEmail", error);
  }

  return NextResponse.json({ success: true });
}
