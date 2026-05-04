import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { getAppOrigin, sendWelcomeEmail } from "@/lib/resend-welcome-email";

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

  if (!isAdminEmail(adminUser.email)) {
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
  const redirectTo = `${getAppOrigin()}/set-password`;

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { company_name },
      redirectTo,
    });

  if (inviteError || !inviteData.user) {
    console.error("[invite-customer] Supabase inviteUserByEmail", {
      email,
      message: inviteError?.message,
      name: inviteError?.name,
      status: inviteError?.status,
    });
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

  const nowIso = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    email,
    company_name,
    plan,
    status: "active",
    invited_at: nowIso,
  });

  if (profileError) {
    console.error("[invite-customer] profiles insert", {
      email,
      userId,
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
    });
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: profileError.message ?? "Kunne ikke oprette profil." },
      { status: 400 }
    );
  }

  const welcome = await sendWelcomeEmail(email, company_name);
  const welcomeEmailSent = welcome.ok;
  const welcomeEmailError = welcome.ok ? undefined : welcome.error;

  return NextResponse.json({
    ok: true,
    user_id: userId,
    welcomeEmailSent,
    ...(welcomeEmailError !== undefined ? { welcomeEmailError } : {}),
  });
}
