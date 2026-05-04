import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const PLANS = ["basis", "standard", "plus"] as const;
type Plan = (typeof PLANS)[number];

function isPlan(v: unknown): v is Plan {
  return typeof v === "string" && (PLANS as readonly string[]).includes(v);
}

function createUserClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getAppOrigin(): string {
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

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Manglende adgangstoken." }, { status: 401 });
  }

  const userClient = createUserClient(accessToken);
  const {
    data: { user: adminUser },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !adminUser) {
    return NextResponse.json({ error: "Ugyldig session." }, { status: 401 });
  }

  const { data: adminRow, error: adminErr } = await userClient
    .from("admins")
    .select("user_id")
    .eq("user_id", adminUser.id)
    .maybeSingle();

  if (adminErr || !adminRow) {
    return NextResponse.json({ error: "Ingen admin-adgang." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const emailRaw =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : null;
  const companyRaw =
    typeof body === "object" && body !== null && "company_name" in body
      ? (body as { company_name: unknown }).company_name
      : null;
  const planRaw =
    typeof body === "object" && body !== null && "plan" in body
      ? (body as { plan: unknown }).plan
      : null;

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const company_name =
    typeof companyRaw === "string" ? companyRaw.trim() : "";
  const plan = planRaw;

  if (!email || !company_name) {
    return NextResponse.json(
      { error: "E-mail og virksomhedsnavn er påkrævet." },
      { status: 400 }
    );
  }

  if (!isPlan(plan)) {
    return NextResponse.json({ error: "Ugyldig plan." }, { status: 400 });
  }

  const admin = getServiceClient();
  const redirectTo = `${getAppOrigin()}/portal`;

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { company_name },
      redirectTo,
    });

  if (inviteError || !inviteData.user) {
    return NextResponse.json(
      {
        error:
          inviteError?.message ??
          "Kunne ikke sende invitation. E-mailen er måske allerede registreret.",
      },
      { status: 400 }
    );
  }

  const userId = inviteData.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    email,
    company_name,
    plan,
    status: "active",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: profileError.message ?? "Kunne ikke oprette profil." },
      { status: 400 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  let welcomeEmailSent = false;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Systemklar <onboarding@resend.dev>";

    const portalUrl = `${getAppOrigin()}/portal`;

    const { error: sendErr } = await resend.emails.send({
      from,
      to: email,
      subject: "Velkommen til Systemklar 👋",
      html: `
        <p>Hej,</p>
        <p>Velkommen til <strong>Systemklar</strong> – vi er glade for at have ${escapeHtml(
          company_name
        )} med.</p>
        <p>Du har modtaget en separat e-mail fra os med et link til at vælge adgangskode. Når du har sat adgangskoden, kan du logge ind på <a href="${portalUrl}">kundeportalen</a>.</p>
        <p>Med venlig hilsen<br/>Systemklar</p>
      `,
    });

    if (sendErr) {
      console.error("[invite-customer] Resend", sendErr);
    } else {
      welcomeEmailSent = true;
    }
  } else {
    console.warn("[invite-customer] RESEND_API_KEY mangler; springer velkomstmail over.");
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    welcomeEmailSent,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
