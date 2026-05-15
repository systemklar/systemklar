import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { runMonitoringForAllOrganisationsWithDomain } from "../../src/lib/monitoring/run-for-organisation";

/**
 * Planlagt overvågning (hver time). Kræver `NEXT_PUBLIC_SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY`.
 */
export default async function runMonitoringScheduled() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[run-monitoring] Mangler NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const result = await runMonitoringForAllOrganisationsWithDomain(admin);
  console.log("[run-monitoring]", JSON.stringify(result));
}

export const config: Config = {
  schedule: "@hourly",
};
