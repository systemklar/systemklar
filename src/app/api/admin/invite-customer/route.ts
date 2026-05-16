import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { sendInviteEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/resend-welcome-email";
import { isLikelyOrganisationDomain, normalizeOrganisationDomainInput } from "@/lib/organisation-domain";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

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

function parseOptionalDomain(raw: unknown): { ok: true; domain: string | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, domain: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Domæne skal være tekst." };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, domain: null };
  }
  const normalized = normalizeOrganisationDomainInput(trimmed);
  if (normalized === "" || !isLikelyOrganisationDomain(normalized)) {
    return {
      ok: false,
      error: "Domænet ser ikke gyldigt ud. Brug fx firmadomain.dk uden https://.",
    };
  }
  return { ok: true, domain: normalized };
}

function readInviteBody(body: unknown): {
  email: string;
  organisationName: string;
  contactName: string;
  role: "member" | "org_admin";
} | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const o = body as Record<string, unknown>;

  /** Primært: { contactName, email, organisationName, role } — bagudkompatibilitet: snake_case */
  const emailRaw = o.email ?? o.Email;
  const organisationNameRaw = o.organisationName ?? o.company_name ?? o.companyName;
  const contactNameRaw = o.contactName ?? o.contact_name;
  const roleRaw = o.role;

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const organisationName =
    typeof organisationNameRaw === "string" ? organisationNameRaw.trim() : "";
  const contactName = typeof contactNameRaw === "string" ? contactNameRaw.trim() : "";
  const role: "member" | "org_admin" = roleRaw === "member" ? "member" : "org_admin";

  if (!email || !organisationName || !contactName) {
    return null;
  }

  return { email, organisationName, contactName, role };
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Manglende Authorization Bearer-token. Prøv at logge ud og ind igen." },
      { status: 401 },
    );
  }

  const userClient = createUserClient(accessToken);
  const {
    data: { user: adminUser },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !adminUser) {
    console.error("[api/admin/invite-customer] getUser failed", userError?.message ?? "no user");
    return NextResponse.json(
      { error: "Ugyldig eller udløbet session. Log ind igen i admin-portalen." },
      { status: 401 },
    );
  }

  if (!isAdminEmail(adminUser.email)) {
    return NextResponse.json(
      { error: "Du har ikke admin-adgang til denne handling." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Kunne ikke læse request (ikke gyldig JSON)." }, { status: 400 });
  }

  console.log("[api/admin/invite-customer] called with body:", body);

  const parsed = readInviteBody(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Mangler eller ugyldige felter. Forvent { contactName, email, organisationName, role }. E-mail, virksomhed og kontaktnavn skal være udfyldt.",
      },
      { status: 400 },
    );
  }

  const { email, organisationName, contactName, role } = parsed;

  const domainRaw =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).domain
      : undefined;
  const domainParsed = parseOptionalDomain(domainRaw);
  if (!domainParsed.ok) {
    return NextResponse.json({ error: domainParsed.error }, { status: 400 });
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    console.error("[api/admin/invite-customer] SUPABASE_SERVICE_ROLE_KEY mangler eller NEXT_PUBLIC_SUPABASE_URL");
    return NextResponse.json(
      {
        error:
          "Serveren er ikke konfigureret til at oprette kunder (mangler SUPABASE_SERVICE_ROLE_KEY). Kontakt udviklere.",
      },
      { status: 500 },
    );
  }

  const { data: organisation, error: organisationError } = await supabaseAdmin
    .from("organisations")
    .insert({ name: organisationName, domain: domainParsed.domain })
    .select("id,name")
    .single();

  if (organisationError || !organisation) {
    const msg =
      organisationError?.message?.trim() ||
      "Database kunne ikke oprette organisationen (ukendt fejl).";
    console.error("[api/admin/invite-customer] organisation insert failed", organisationError);
    return NextResponse.json(
      { error: `Kunne ikke oprette organisation: ${msg}` },
      { status: 400 },
    );
  }

  console.log("[api/admin/invite-customer] organisation created", { id: organisation.id, name: organisation.name });

  const { data: invitation, error: invitationError } = await supabaseAdmin
    .from("invitations")
    .insert({
      organisation_id: organisation.id,
      email,
      role,
      contact_name: contactName,
      invited_by: adminUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token, expires_at")
    .single();

  if (invitationError || !invitation) {
    console.error("[api/admin/invite-customer] invitation insert failed", invitationError);
    await supabaseAdmin.from("organisations").delete().eq("id", organisation.id);
    const msg =
      invitationError?.message?.trim() ||
      "Database kunne ikke oprette invitationen (ukendt fejl).";
    return NextResponse.json(
      { error: `Kunne ikke oprette invitation: ${msg}` },
      { status: 400 },
    );
  }

  console.log("[api/admin/invite-customer] invitation created", {
    expires_at: invitation.expires_at,
    hasToken: Boolean(invitation.token),
  });

  const inviteUrl = `${getAppOrigin()}/invite?token=${encodeURIComponent(invitation.token as string)}`;
  try {
    await sendInviteEmail(email, contactName || email, organisation.name as string, inviteUrl);
    console.log("[api/admin/invite-customer] invite email sent to", email);
  } catch (error) {
    console.error("[api/admin/invite-customer] sendInviteEmail failed", error);
    return NextResponse.json(
      {
        ok: true,
        organisation_id: organisation.id,
        warning:
          "Organisation og invitation er oprettet, men invitationsmailen kunne ikke sendes. Tjek Resend-konfiguration og serverlogs.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, organisation_id: organisation.id });
}
