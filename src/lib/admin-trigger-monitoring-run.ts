import { runMonitoringForOrganisation } from "@/lib/monitoring/run-for-organisation";
import { getAppOrigin } from "@/lib/resend-welcome-email";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

/**
 * Starts POST /api/admin/monitoring/run in the background (does not block the caller).
 * Forwards admin session cookies when present; otherwise runs with service role directly.
 */
export function scheduleAdminMonitoringRun(
  organisationId: string,
  options?: { cookieHeader?: string | null },
): void {
  const cookieHeader = options?.cookieHeader?.trim();

  void (async () => {
    try {
      if (cookieHeader) {
        const res = await fetch(`${getAppOrigin()}/api/admin/monitoring/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ organisationId }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(
            "[scheduleAdminMonitoringRun] monitoring/run HTTP",
            res.status,
            text.slice(0, 400),
          );
        }
        return;
      }

      const admin = createServiceRoleClient();
      if (!admin) {
        console.error("[scheduleAdminMonitoringRun] missing service role client");
        return;
      }
      const result = await runMonitoringForOrganisation(admin, organisationId);
      if (!result.ok) {
        console.error("[scheduleAdminMonitoringRun]", result.message ?? "overvågning fejlede");
      }
    } catch (error) {
      console.error("[scheduleAdminMonitoringRun]", error);
    }
  })();
}
