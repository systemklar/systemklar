import { NextResponse } from "next/server";
import { ALL_ONBOARDING_SYSTEMS } from "@/lib/onboarding-systems";
import type { SystemUsageByName } from "@/lib/admin-system-reference";
import { normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const [profilesRes, orgsRes] = await Promise.all([
    admin.from("profiles").select("organisation_id, onboarding_systems").not("organisation_id", "is", null),
    admin.from("organisations").select("id, name"),
  ]);

  if (profilesRes.error) {
    console.error("[api/admin/system-reference] profiles", profilesRes.error);
    return NextResponse.json({ error: profilesRes.error.message }, { status: 400 });
  }
  if (orgsRes.error) {
    console.error("[api/admin/system-reference] organisations", orgsRes.error);
    return NextResponse.json({ error: orgsRes.error.message }, { status: 400 });
  }

  const orgNames = new Map<string, string>();
  for (const o of orgsRes.data ?? []) {
    const id = (o as { id: string }).id;
    const name = (o as { name: string }).name?.trim() || "Ukendt";
    orgNames.set(id, name);
  }

  const usageByName: SystemUsageByName = {};
  for (const sys of ALL_ONBOARDING_SYSTEMS) {
    usageByName[sys.name] = { count: 0, customers: [] };
  }

  const seenPerSystem = new Map<string, Set<string>>();

  for (const row of profilesRes.data ?? []) {
    const orgId = (row as { organisation_id: string }).organisation_id;
    const systems = normalizeOnboardingSystemsFromDb(
      (row as { onboarding_systems?: unknown }).onboarding_systems,
    );
    const orgName = orgNames.get(orgId) ?? "Ukendt";

    for (const storedName of systems) {
      const bucket = usageByName[storedName];
      if (!bucket) continue;
      const seen = seenPerSystem.get(storedName) ?? new Set<string>();
      if (seen.has(orgId)) continue;
      seen.add(orgId);
      seenPerSystem.set(storedName, seen);
      bucket.count += 1;
      bucket.customers.push({ organisationId: orgId, organisationName: orgName });
    }
  }

  for (const key of Object.keys(usageByName)) {
    usageByName[key]!.customers.sort((a, b) =>
      a.organisationName.localeCompare(b.organisationName, "da"),
    );
  }

  return NextResponse.json({ usageByName });
}
