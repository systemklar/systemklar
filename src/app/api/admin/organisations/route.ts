import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const ORGANISATIONS_SELECT =
  "*, profiles(id, full_name, email, role, avatar_initials, created_at), invitations(id, email, contact_name, accepted_at, created_at)";

/** Admin-liste af organisationer (service role bypasser RLS). Kræver admin cookie-session. */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("organisations")
    .select(ORGANISATIONS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/admin/organisations] GET select", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ organisations: data ?? [] });
}
