"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { usePortalSession } from "@/components/portal/PortalLayout";
import { fetchCurrentProfile, normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import { buildOnboardingDashboardGroups, type OnboardingDashboardGroup } from "@/lib/onboarding-systems";
import { createClient } from "@/lib/supabase";
import {
  formatCheckedAgoDa,
  monitoringResultsBySystemName,
  type MonitoringResultRow,
} from "@/components/monitoring/MonitoringStatusBlock";

type PortalSystemsDashboardProps = {
  /** Admin-forhåndsvisning: brug props i stedet for at hente profil. */
  preview?: boolean;
  fullName?: string | null;
  onboardingSystemNames?: string[];
  /** Ved admin-forhåndsvisning: org-id så monitoring kan hentes fra API. */
  organisationId?: string | null;
};

/** Tekniske onboarding-navne → kundevenlige danske navne. */
const FRIENDLY_SYSTEM_LABEL_DA: Record<string, string> = {
  "Hjemmeside / oppetid": "Hjemmeside",
  "SSL-certifikat": "Sikkerhedscertifikat",
  "DNS / SPF / DKIM / DMARC": "Email-sikkerhed",
  "Domæne / WHOIS": "Domæne",
  "Google PageSpeed": "Hjemmeside hastighed",
  "Have I Been Pwned (datalæk)": "Datalæk-tjek",
};

function friendlySystemLabel(technicalName: string): string {
  const t = technicalName.trim();
  return FRIENDLY_SYSTEM_LABEL_DA[t] ?? t;
}

type FlatSystemRow = {
  key: string;
  technicalName: string;
  friendlyName: string;
};

function flattenSystems(groups: OnboardingDashboardGroup[]): FlatSystemRow[] {
  const out: FlatSystemRow[] = [];
  for (const g of groups) {
    let idx = 0;
    for (const entry of g.items) {
      const technical = entry.kind === "known" ? entry.system.name : entry.name;
      const key =
        entry.kind === "known" ? entry.system.id : `u-${g.shortLabel}-${technical}-${idx}`;
      out.push({
        key,
        technicalName: technical,
        friendlyName: friendlySystemLabel(technical),
      });
      idx += 1;
    }
  }
  return out;
}

function normalizeStatus(raw: string | undefined): "ok" | "advarsel" | "fejl" | "afventer" {
  const s = (raw ?? "afventer").toLowerCase();
  if (s === "ok" || s === "advarsel" || s === "fejl" || s === "afventer") return s;
  return "afventer";
}

function rowStatusText(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
  switch (status) {
    case "ok":
      return "Fungerer";
    case "advarsel":
      return "Kræver opmærksomhed";
    case "fejl":
      return "Virker ikke";
    default:
      return "Afventer opsætning";
  }
}

function dotClass(status: "ok" | "advarsel" | "fejl" | "afventer"): string {
  switch (status) {
    case "ok":
      return "bg-emerald-500";
    case "advarsel":
      return "bg-amber-400";
    case "fejl":
      return "bg-red-500";
    default:
      return "bg-slate-300";
  }
}

function tingOrTing(n: number): string {
  return n === 1 ? "1 ting" : `${n} ting`;
}

export function PortalSystemsDashboard({
  preview = false,
  onboardingSystemNames: namesProp,
  organisationId: organisationIdProp,
}: PortalSystemsDashboardProps) {
  const portalSession = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(() => !preview);
  const [resolvedOrganisationId, setResolvedOrganisationId] = useState<string | null>(null);
  const [onboardingNames, setOnboardingNames] = useState<string[]>([]);
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(() => new Map());

  const orgIdForMonitoring = preview
    ? (organisationIdProp?.trim() || null)
    : (resolvedOrganisationId?.trim() || null);

  const namesLive = preview ? normalizeOnboardingSystemsFromDb(namesProp) : onboardingNames;

  useEffect(() => {
    if (preview) return;

    const userId = portalSession?.userId?.trim();
    if (!userId) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setLoading(true);
          setResolvedOrganisationId(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setResolvedOrganisationId(null);
      const profile = await fetchCurrentProfile(supabase, userId);
      if (cancelled) return;
      if (profile) {
        console.log("[PortalSystemsDashboard] profile.onboarding_systems", profile.onboarding_systems);
        console.log("[PortalSystemsDashboard] profile.organisation_id", profile.organisation_id);
      } else {
        console.log("[PortalSystemsDashboard] profile fetch returned null");
      }
      setOnboardingNames(normalizeOnboardingSystemsFromDb(profile?.onboarding_systems));
      setResolvedOrganisationId(profile?.organisation_id?.trim() || null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [preview, supabase, portalSession?.userId]);

  useEffect(() => {
    if (!orgIdForMonitoring) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) setMonitoringByName(new Map());
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/monitoring/${encodeURIComponent(orgIdForMonitoring)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setMonitoringByName(new Map());
          return;
        }
        const data = (await res.json()) as { results?: MonitoringResultRow[] };
        if (cancelled) return;
        setMonitoringByName(monitoringResultsBySystemName(data.results ?? []));
      } catch {
        if (!cancelled) setMonitoringByName(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgIdForMonitoring]);

  const groups = useMemo(
    () => buildOnboardingDashboardGroups(namesLive),
    [namesLive],
  );

  const flatRows = useMemo(() => flattenSystems(groups), [groups]);

  const summary = useMemo(() => {
    let fejl = 0;
    let advarsel = 0;
    for (const row of flatRows) {
      const st = normalizeStatus(monitoringByName.get(row.technicalName)?.status);
      if (st === "fejl") fejl += 1;
      else if (st === "advarsel") advarsel += 1;
    }
    return { fejl, advarsel };
  }, [flatRows, monitoringByName]);

  const hasSystems = flatRows.length > 0;

  if (loading) {
    return <p className="text-sm text-[#4A8CB5]">Indlæser overblik...</p>;
  }

  return (
    <div className="space-y-8 pb-6">
      {preview ? (
        <p className="text-center text-xs text-[#7AAEC8]">Forhåndsvisning af kundens portal-overblik</p>
      ) : null}

      {!preview ? (
        <div className="flex justify-end">
          <Link
            href="/portal/support"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Opret IT-sag
          </Link>
        </div>
      ) : null}

      {!hasSystems ? (
        <p className="rounded-xl border border-sky-100 bg-white px-5 py-10 text-center text-sm leading-relaxed text-[#2C4A5E] shadow-sm">
          Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
        </p>
      ) : (
        <>
          <section
            className={`rounded-2xl border px-6 py-10 text-center shadow-sm ${
              summary.fejl > 0
                ? "border-red-100 bg-red-50/60"
                : summary.advarsel > 0
                  ? "border-amber-100 bg-amber-50/50"
                  : "border-emerald-100 bg-emerald-50/50"
            }`}
            aria-live="polite"
          >
            {summary.fejl > 0 ? (
              <>
                <XCircle className="mx-auto h-16 w-16 text-red-600 sm:h-20 sm:w-20" strokeWidth={1.5} aria-hidden />
                <p className="mt-5 text-2xl font-semibold leading-snug text-red-900 sm:text-3xl">
                  {tingOrTing(summary.fejl)} virker ikke
                </p>
              </>
            ) : summary.advarsel > 0 ? (
              <>
                <AlertTriangle
                  className="mx-auto h-16 w-16 text-amber-600 sm:h-20 sm:w-20"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="mt-5 text-2xl font-semibold leading-snug text-amber-950 sm:text-3xl">
                  {tingOrTing(summary.advarsel)} kræver opmærksomhed
                </p>
              </>
            ) : (
              <>
                <CheckCircle2
                  className="mx-auto h-16 w-16 text-emerald-600 sm:h-20 sm:w-20"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="mt-5 text-2xl font-semibold leading-snug text-emerald-950 sm:text-3xl">
                  Alt fungerer som det skal
                </p>
              </>
            )}
          </section>

          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {flatRows.map((row) => {
              const monitoringRow = monitoringByName.get(row.technicalName) ?? null;
              const status = normalizeStatus(monitoringRow?.status);
              const checked = monitoringRow?.checked_at
                ? formatCheckedAgoDa(monitoringRow.checked_at)
                : "";

              return (
                <li
                  key={row.key}
                  className="flex items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass(status)}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-[#0D1F2D]">{row.friendlyName}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{rowStatusText(status)}</p>
                  </div>
                  {checked ? (
                    <p className="max-w-[40%] shrink-0 text-right text-[10px] leading-tight text-slate-400 sm:max-w-none">
                      {checked}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
