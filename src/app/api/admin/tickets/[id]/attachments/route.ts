import { NextResponse } from "next/server";
import {
  normalizeAttachmentRows,
  TICKET_ATTACHMENTS_SELECT,
} from "@/lib/fetch-ticket-attachments";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import { TICKET_ATTACHMENTS_BUCKET } from "@/lib/upload-ticket-attachment";

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveOpenUrl(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  storagePath: string,
): Promise<string> {
  const { data: signed } = await admin.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);
  if (signed?.signedUrl) return signed.signedUrl;

  const { data: publicData } = admin.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .getPublicUrl(storagePath);
  return publicData.publicUrl;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: ticketId } = await context.params;

  if (!UUID_RE.test(ticketId)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/tickets/[id]/attachments] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: ticket, error: ticketErr } = await admin
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketErr) {
    console.error("[api/admin/tickets/[id]/attachments] ticket", ticketErr);
    return NextResponse.json({ error: ticketErr.message }, { status: 400 });
  }
  if (!ticket) {
    return NextResponse.json({ error: "Ikke fundet." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("attachments")
    .select(TICKET_ATTACHMENTS_SELECT)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/admin/tickets/[id]/attachments] select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const attachments = normalizeAttachmentRows(data ?? []);
  const openUrls: Record<string, string> = {};
  await Promise.all(
    attachments.map(async (a) => {
      openUrls[a.id] = await resolveOpenUrl(admin, a.storage_path);
    }),
  );

  return NextResponse.json({ attachments, openUrls });
}
