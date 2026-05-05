import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: systems, error } = await admin
    .from("systems")
    .select("id, user_id, name, type, status, last_checked, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (systems ?? []) as {
    id: string;
    user_id: string;
    name: string;
    type: string;
    status: string;
    last_checked: string | null;
    created_at: string;
  }[];

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, company_name, email")
    .in("user_id", userIds);
  const byUser = new Map(
    ((profiles ?? []) as { user_id: string; company_name: string; email: string }[]).map((p) => [p.user_id, p]),
  );

  const enriched = rows.map((r) => ({
    ...r,
    company_name: byUser.get(r.user_id)?.company_name ?? "Ukendt kunde",
    email: byUser.get(r.user_id)?.email ?? "",
  }));

  return NextResponse.json({ systems: enriched });
}
