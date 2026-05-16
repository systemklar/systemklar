import { NextResponse } from "next/server";
import { decryptCredentialPayload } from "@/lib/credential-crypto";
import { getPortalAuthed } from "@/lib/portal-api-auth";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { verifySystemCredential } from "@/lib/system-credential-verify";
import { isSelfServiceCredentialSystem } from "@/lib/system-self-service-setup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authed = await getPortalAuthed();
  if (!authed) {
    return NextResponse.json({ error: "Ikke logget ind eller mangler organisation." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const systemNameRaw = (body as { systemName?: unknown }).systemName;
  const systemName = typeof systemNameRaw === "string" ? systemNameRaw.trim() : "";
  if (!isSelfServiceCredentialSystem(systemName)) {
    return NextResponse.json({ error: "Ukendt system." }, { status: 400 });
  }

  const bodyOrg = (body as { organisationId?: unknown }).organisationId;
  const organisationId =
    typeof bodyOrg === "string" && bodyOrg.trim() === authed.organisationId
      ? bodyOrg.trim()
      : authed.organisationId;

  const { data: row, error: selErr } = await authed.client
    .from("system_credentials")
    .select("id, encrypted_payload")
    .eq("organisation_id", organisationId)
    .eq("system_name", systemName)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 400 });
  }
  if (!row) {
    return NextResponse.json({ error: "Gem nøglerne først." }, { status: 404 });
  }

  let fields: Record<string, string>;
  try {
    const payload = decryptCredentialPayload(String((row as { encrypted_payload: string }).encrypted_payload));
    fields = payload.fields;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Dekryptering fejlede.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const result = await verifySystemCredential(systemName, fields);

  if (!result.valid) {
    return NextResponse.json({
      verified: false,
      error: result.message ?? "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt.",
    });
  }

  const now = new Date().toISOString();
  const { error: upErr } = await authed.client
    .from("system_credentials")
    .update({ verified: true, verified_at: now })
    .eq("organisation_id", organisationId)
    .eq("system_name", systemName);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (admin) {
    await admin.from("monitoring_results").insert({
      organisation_id: organisationId,
      system_name: systemName,
      status: "ok",
      checked_at: now,
      details: { source: "credential_verify" },
    });
  }

  return NextResponse.json({ verified: true });
}
