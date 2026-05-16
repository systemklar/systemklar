export type ProfileNotificationPreferences = {
  ticket_updated: boolean;
  system_failure: boolean;
  report_ready: boolean;
  weekly_status: boolean;
};

export type OrganisationNotificationPreferences = {
  notify_all_system_failure: boolean;
  notify_all_monthly_report: boolean;
};

export const PROFILE_NOTIFICATION_DEFAULTS: ProfileNotificationPreferences = {
  ticket_updated: true,
  system_failure: true,
  report_ready: true,
  weekly_status: false,
};

export const ORGANISATION_NOTIFICATION_DEFAULTS: OrganisationNotificationPreferences = {
  notify_all_system_failure: true,
  notify_all_monthly_report: true,
};

type LegacyProfileNotif = {
  notif_new_message?: boolean | null;
  notif_status_change?: boolean | null;
  notif_monthly_report?: boolean | null;
};

function readBool(obj: Record<string, unknown>, key: string): boolean | undefined {
  const v = obj[key];
  return typeof v === "boolean" ? v : undefined;
}

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parseJsonObject(parsed);
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

export function resolveProfileNotificationPreferences(
  raw: unknown,
  legacy?: LegacyProfileNotif,
): ProfileNotificationPreferences {
  const obj = parseJsonObject(raw);
  const hasStoredPrefs = obj != null && Object.keys(obj).length > 0;

  if (hasStoredPrefs) {
    return {
      ticket_updated:
        readBool(obj, "ticket_updated") ?? PROFILE_NOTIFICATION_DEFAULTS.ticket_updated,
      system_failure:
        readBool(obj, "system_failure") ?? PROFILE_NOTIFICATION_DEFAULTS.system_failure,
      report_ready:
        readBool(obj, "report_ready") ?? PROFILE_NOTIFICATION_DEFAULTS.report_ready,
      weekly_status:
        readBool(obj, "weekly_status") ?? PROFILE_NOTIFICATION_DEFAULTS.weekly_status,
    };
  }

  const ticketLegacy =
    legacy?.notif_new_message ?? legacy?.notif_status_change ?? undefined;

  return {
    ticket_updated: ticketLegacy ?? PROFILE_NOTIFICATION_DEFAULTS.ticket_updated,
    system_failure: PROFILE_NOTIFICATION_DEFAULTS.system_failure,
    report_ready: legacy?.notif_monthly_report ?? PROFILE_NOTIFICATION_DEFAULTS.report_ready,
    weekly_status: PROFILE_NOTIFICATION_DEFAULTS.weekly_status,
  };
}

export function profileNotificationPreferencesToJson(
  prefs: ProfileNotificationPreferences,
): Record<string, boolean> {
  return { ...prefs };
}

export function resolveOrganisationNotificationPreferences(
  raw: unknown,
): OrganisationNotificationPreferences {
  const obj = parseJsonObject(raw);
  if (!obj || Object.keys(obj).length === 0) {
    return { ...ORGANISATION_NOTIFICATION_DEFAULTS };
  }
  return {
    notify_all_system_failure:
      readBool(obj, "notify_all_system_failure") ??
      ORGANISATION_NOTIFICATION_DEFAULTS.notify_all_system_failure,
    notify_all_monthly_report:
      readBool(obj, "notify_all_monthly_report") ??
      ORGANISATION_NOTIFICATION_DEFAULTS.notify_all_monthly_report,
  };
}

export function organisationNotificationPreferencesToJson(
  prefs: OrganisationNotificationPreferences,
): Record<string, boolean> {
  return { ...prefs };
}

export function profileWantsTicketUpdatedEmails(
  raw: unknown,
  legacy?: LegacyProfileNotif,
): boolean {
  return resolveProfileNotificationPreferences(raw, legacy).ticket_updated;
}

export function profileWantsReportReadyEmails(
  raw: unknown,
  legacy?: LegacyProfileNotif,
): boolean {
  return resolveProfileNotificationPreferences(raw, legacy).report_ready;
}

export function organisationWantsNotifyAllMonthlyReport(raw: unknown): boolean {
  return resolveOrganisationNotificationPreferences(raw).notify_all_monthly_report;
}
