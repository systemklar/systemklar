import { NextResponse } from "next/server";
import {
  encryptCredentialPayload,
  type CredentialFieldsPayload,
} from "@/lib/credential-crypto";
import { getPortalAuthed } from "@/lib/portal-api-auth";
import {
  getSelfServiceSetupConfig,
  isSelfServiceCredentialSystem,
} from "@/lib/system-self-service-setup";

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
    return NextResponse.json({ error: "Systemet understøtter ikke self-service opsætning." }, { status: 400 });
  }

  const bodyOrg = (body as { organisationId?: unknown }).organisationId;
  const organisationId =
    typeof bodyOrg === "string" && bodyOrg.trim() === authed.organisationId
      ? bodyOrg.trim()
      : authed.organisationId;

  const fieldsRaw = (body as { fields?: unknown }).fields;
  if (!fieldsRaw || typeof fieldsRaw !== "object" || Array.isArray(fieldsRaw)) {
    return NextResponse.json({ error: "Mangler fields." }, { status: 400 });
  }

  const config = getSelfServiceSetupConfig(systemName)!;
  const fields: Record<string, string> = {};
  for (const f of config.fields) {
    const v = (fieldsRaw as Record<string, unknown>)[f.key];
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) {
      return NextResponse.json({ error: `Mangler ${f.label}.` }, { status: 400 });
    }
    fields[f.key] = s;
  }

  const payload: CredentialFieldsPayload = { version: 1, fields };
  let encrypted_payload: string;
  try {
    encrypted_payload = encryptCredentialPayload(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kryptering fejlede.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await authed.client.from("system_credentials").upsert(
    {
      organisation_id: organisationId,
      system_name: systemName,
      encrypted_payload,
      verified: false,
      verified_at: null,
    },
    { onConflict: "organisation_id,system_name" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, organisationId, systemName });
}
