import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeOnboardingSystemsFromDb } from "../current-profile";
import { runCheckForSystemName } from "./checks";

export type MonitoringRow = {
  organisation_id: string;
  system_name: string;
  status: string;
  checked_at: string;
  details: Record<string, unknown>;
};

export async function collectOnboardingSystemNames(
  admin: SupabaseClient,
  organisationId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("onboarding_systems")
    .eq("organisation_id", organisationId);
  if (error) {
    console.error("[monitoring] collect profiles", error);
    return [];
  }
  const names = new Set<string>();
  for (const row of data ?? []) {
    const list = normalizeOnboardingSystemsFromDb((row as { onboarding_systems?: unknown }).onboarding_systems);
    for (const n of list) names.add(n);
  }
  return [...names];
}

/**
 * Kører alle implementerede checks for valgte onboarding-systemer og upserter rækker i `monitoring_results`.
 */
export async function runMonitoringForOrganisation(
  admin: SupabaseClient,
  organisationId: string,
): Promise<{ ok: boolean; message?: string; systemsChecked: number }> {
  const { data: org, error: orgErr } = await admin
    .from("organisations")
    .select("id, domain")
    .eq("id", organisationId)
    .maybeSingle();

  if (orgErr || !org) {
    return { ok: false, message: orgErr?.message ?? "Organisation ikke fundet.", systemsChecked: 0 };
  }

  const domainRaw = (org as { domain?: string | null }).domain?.trim() ?? "";
  if (!domainRaw) {
    return { ok: false, message: "Organisationen har intet domæne sat.", systemsChecked: 0 };
  }

  const systemNames = await collectOnboardingSystemNames(admin, organisationId);
  if (systemNames.length === 0) {
    return { ok: true, systemsChecked: 0, message: "Ingen onboarding-systemer at overvåge." };
  }

  const env = {
    googlePageSpeedKey: process.env.GOOGLE_PAGESPEED_API_KEY,
    hibpApiKey: process.env.HIBP_API_KEY,
  };

  const checkedAt = new Date().toISOString();
  const rows: MonitoringRow[] = [];

  for (const systemName of systemNames) {
    try {
      const result = await runCheckForSystemName(systemName, domainRaw, env);
      rows.push({
        organisation_id: organisationId,
        system_name: systemName,
        status: result.status,
        checked_at: checkedAt,
        details: result.details,
      });
    } catch (e) {
      rows.push({
        organisation_id: organisationId,
        system_name: systemName,
        status: "fejl",
        checked_at: checkedAt,
        details: { error: e instanceof Error ? e.message : String(e) },
      });
    }
  }

  const { error: upsertErr } = await admin.from("monitoring_results").upsert(rows, {
    onConflict: "organisation_id,system_name",
  });

  if (upsertErr) {
    console.error("[monitoring] upsert", upsertErr);
    return { ok: false, message: upsertErr.message, systemsChecked: rows.length };
  }

  return { ok: true, systemsChecked: rows.length };
}

export async function runMonitoringForAllOrganisationsWithDomain(
  admin: SupabaseClient,
): Promise<{ organisations: number; totalChecks: number; errors: string[] }> {
  const errors: string[] = [];
  const { data: orgs, error } = await admin.from("organisations").select("id").not("domain", "is", null);
  if (error) {
    errors.push(error.message);
    return { organisations: 0, totalChecks: 0, errors };
  }
  let totalChecks = 0;
  for (const row of orgs ?? []) {
    const id = (row as { id: string }).id;
    const res = await runMonitoringForOrganisation(admin, id);
    totalChecks += res.systemsChecked;
    if (!res.ok && res.message) errors.push(`${id}: ${res.message}`);
  }
  return { organisations: (orgs ?? []).length, totalChecks, errors };
}
