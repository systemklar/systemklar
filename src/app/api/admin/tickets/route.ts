import { NextResponse } from "next/server";
import { mergeTicketRowsWithProfiles, resolveDisplayProfilesForOrganisationIds } from "@/lib/admin-ticket-profiles";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/tickets] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: tickets, error } = await admin
    .from("tickets")
    .select("id, ticket_number, title, description, status, priority, organisation_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/admin/tickets] select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = tickets ?? [];
  const organisationIds = rows.map((t) => t.organisation_id as string).filter(Boolean);
  const profileByUserId = await resolveDisplayProfilesForOrganisationIds(admin, organisationIds);
  const merged = mergeTicketRowsWithProfiles(
    rows as unknown as Record<string, unknown>[],
    profileByUserId,
  );

  return NextResponse.json({ tickets: merged });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/tickets] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const bodyRecord = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const organisationId = String(bodyRecord.organisation_id ?? "").trim();
  const title = String(bodyRecord.title ?? "").trim();
  const description = String(bodyRecord.description ?? "").trim();
  const priorityRaw = String(bodyRecord.priority ?? "medium").trim().toLowerCase();
  const priority =
    priorityRaw === "lav" || priorityRaw === "low"
      ? "low"
      : priorityRaw === "høj" || priorityRaw === "hoj" || priorityRaw === "high"
        ? "high"
        : "medium";

  if (!organisationId) {
    return NextResponse.json({ error: "Vælg en kunde/organisation." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Titel er påkrævet." }, { status: 400 });
  }

  const { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .select("id, name")
    .eq("id", organisationId)
    .maybeSingle();

  if (organisationError) {
    console.error("[api/admin/tickets] organisation select", organisationError);
    return NextResponse.json({ error: organisationError.message }, { status: 400 });
  }
  if (!organisation) {
    return NextResponse.json({ error: "Organisation ikke fundet." }, { status: 404 });
  }

  const { data: inserted, error: insertError } = await admin
    .from("tickets")
    .insert({
      title,
      description: description || "",
      priority,
      status: "active",
      user_id: auth.user.id,
      organisation_id: organisationId,
      created_by: auth.user.id,
      created_by_name: auth.user.email ?? "Admin",
    })
    .select("id, title, ticket_number")
    .single();

  if (insertError || !inserted) {
    console.error("[api/admin/tickets] insert", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Kunne ikke oprette sag." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, ticket: inserted });
}
