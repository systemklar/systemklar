"use client";

import Link from "next/link";
import { Info, Package, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalSession } from "@/components/portal/PortalLayout";
import {
  formatCheckedAgoDa,
  monitoringResultsBySystemName,
  type MonitoringResultRow,
} from "@/components/monitoring/MonitoringStatusBlock";
import { fetchCurrentProfile, normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import {
  normalizeMonitoringStatus,
  type MonitoringStatusKey,
} from "@/lib/monitoring/monitoring-dashboard-copy";
import { isAutoMonitoredCustomerSystem } from "@/lib/monitoring/monitoring-system-names";
import {
  buildOnboardingDashboardGroups,
  ONBOARDING_SYSTEM_GROUPS,
  type OnboardingDashboardGroup,
  type OnboardingSystem,
  type ResolvedOnboardingEntry,
} from "@/lib/onboarding-systems";
import { createClient } from "@/lib/supabase";

const FRIENDLY: Record<string, string> = {
  "Hjemmeside / oppetid": "Hjemmeside",
  "SSL-certifikat": "Sikkerhedscertifikat",
  "DNS / SPF / DKIM / DMARC": "Email-sikkerhed",
  "Domæne / WHOIS": "Domæne",
  "Google PageSpeed": "Hjemmeside hastighed",
  "Have I Been Pwned (datalæk)": "Datalæk-tjek",
};

function friendlyLabel(storedName: string): string {
  return FRIENDLY[storedName] ?? storedName;
}

function customerStatusLabel(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "OK";
    case "advarsel":
      return "Kræver opmærksomhed";
    case "fejl":
      return "Virker ikke";
    default:
      return "Afventer opsætning";
  }
}

function statusPillClass(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "border border-[#0A7C5C]/35 bg-[#0A7C5C]/10 text-[#0A7C5C]";
    case "advarsel":
      return "border border-[#C47B0A]/35 bg-[#C47B0A]/10 text-[#C47B0A]";
    case "fejl":
      return "border border-[#C42B2B]/35 bg-[#C42B2B]/10 text-[#C42B2B]";
    default:
      return "border border-[#D0E8F5] bg-[#F5FAFD] text-[#2C4A5E]";
  }
}

type SetupModal =
  | { kind: "manual"; storedName: string; friendlyName: string }
  | { kind: "auto"; friendlyName: string };

function entryMeta(entry: ResolvedOnboardingEntry): {
  storedName: string;
  friendlyName: string;
  Icon: OnboardingSystem["icon"];
} {
  if (entry.kind === "known") {
    return {
      storedName: entry.system.name,
      friendlyName: friendlyLabel(entry.system.name),
      Icon: entry.system.icon,
    };
  }
  return {
    storedName: entry.name,
    friendlyName: entry.name,
    Icon: Package,
  };
}

function SystemCard({
  muted,
  storedName,
  friendlyName,
  Icon,
  status,
  checkedAgo,
  onStartSetup,
  extraAction,
}: {
  muted?: boolean;
  storedName: string;
  friendlyName: string;
  Icon: OnboardingSystem["icon"];
  status: MonitoringStatusKey;
  checkedAgo: string | null;
  onStartSetup?: () => void;
  extraAction?: ReactNode;
}) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm ${
        muted ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5FAFD] text-[#0A6EBD]">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#0D1F2D]">{friendlyName}</h3>
          {storedName !== friendlyName ? (
            <p className="mt-0.5 text-xs text-[#7AAEC8]">{storedName}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(status)}`}
        >
          {customerStatusLabel(status)}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D0E8F5]/80 pt-4">
        <div className="text-sm text-[#7AAEC8]">
          {checkedAgo ? <span>{checkedAgo}</span> : <span>Ingen seneste tjek endnu</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraAction}
          {status === "afventer" && onStartSetup ? (
            <button
              type="button"
              onClick={onStartSetup}
              className="rounded-full bg-[#0A6EBD] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0859A0]"
            >
              Start opsætning
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function groupSection(
  title: string,
  groups: OnboardingDashboardGroup[],
  renderCard: (entry: ResolvedOnboardingEntry) => ReactNode,
): ReactNode {
  if (!groups.length) return null;
  return (
    <section className="space-y-8">
      <h2 className="text-lg font-semibold text-[#0D1F2D]">{title}</h2>
      {groups.map((group) => (
        <div key={group.shortLabel} className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">{group.groupLabel}</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{group.items.map((e) => renderCard(e))}</div>
        </div>
      ))}
    </section>
  );
}

export function PortalSystemsOverviewPage() {
  const portalSession = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [unionNames, setUnionNames] = useState<string[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(() => new Map());
  const [modal, setModal] = useState<SetupModal | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const reloadUnion = useCallback(async () => {
    const userId = portalSession?.userId?.trim();
    if (!userId) {
      setUnionNames([]);
      setOrgId(null);
      return;
    }
    const profile = await fetchCurrentProfile(supabase, userId);
    const oid = profile?.organisation_id?.trim() || null;
    const orderedNames: string[] = [];
    const seen = new Set<string>();
    const pushFrom = (raw: unknown) => {
      for (const n of normalizeOnboardingSystemsFromDb(raw)) {
        if (seen.has(n)) continue;
        seen.add(n);
        orderedNames.push(n);
      }
    };

    if (oid) {
      const { data: peers, error: peersErr } = await supabase
        .from("profiles")
        .select("onboarding_systems")
        .eq("organisation_id", oid)
        .order("created_at", { ascending: true });
      if (peersErr) {
        console.error("[PortalSystemsOverview] profiles union", peersErr);
        pushFrom(profile?.onboarding_systems);
      } else {
        for (const row of peers ?? []) pushFrom((row as { onboarding_systems?: unknown }).onboarding_systems);
      }
    } else {
      pushFrom(profile?.onboarding_systems);
    }
    setUnionNames(orderedNames);
    setOrgId(oid);
  }, [portalSession?.userId, supabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await reloadUnion();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadUnion]);

  useEffect(() => {
    if (!orgId) {
      setMonitoringByName(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/monitoring/${encodeURIComponent(orgId)}`, { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setMonitoringByName(new Map());
          return;
        }
        const data = (await res.json()) as { results?: MonitoringResultRow[] };
        if (!cancelled) setMonitoringByName(monitoringResultsBySystemName(data.results ?? []));
      } catch {
        if (!cancelled) setMonitoringByName(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const unionSet = useMemo(() => new Set(unionNames), [unionNames]);

  const activeGroups = useMemo(() => buildOnboardingDashboardGroups(unionNames), [unionNames]);

  const availableGroups = useMemo(
    () =>
      ONBOARDING_SYSTEM_GROUPS.map((g) => ({
        ...g,
        systems: g.systems.filter((s) => !unionSet.has(s.name)),
      })).filter((g) => g.systems.length > 0),
    [unionSet],
  );

  const openSetupModal = (storedName: string, friendlyName: string) => {
    if (isAutoMonitoredCustomerSystem(storedName)) {
      setModal({ kind: "auto", friendlyName });
    } else {
      setModal({ kind: "manual", storedName, friendlyName });
    }
  };

  const handleAdd = async (system: OnboardingSystem) => {
    setAddError(null);
    setAddingName(system.name);
    try {
      const res = await fetch("/api/portal/profile/onboarding-systems", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName: system.name }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAddError(json.error ?? "Kunne ikke tilføje systemet.");
        return;
      }
      await reloadUnion();
      if (orgId) {
        try {
          const mon = await fetch(`/api/monitoring/${encodeURIComponent(orgId)}`, { credentials: "include" });
          if (mon.ok) {
            const data = (await mon.json()) as { results?: MonitoringResultRow[] };
            setMonitoringByName(monitoringResultsBySystemName(data.results ?? []));
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      setAddError("Netværksfejl. Prøv igen.");
    } finally {
      setAddingName(null);
    }
  };

  const supportSetupHref = (storedName: string) => {
    const subject = `Opsætning af ${storedName}`;
    return `/portal/support/new?${new URLSearchParams({ subject }).toString()}`;
  };

  if (loading) {
    return <p className="text-sm text-[#7AAEC8]">Indlæser systemer…</p>;
  }

  const activeSection = groupSection("Dine systemer", activeGroups, (entry) => {
    const { storedName, friendlyName, Icon } = entryMeta(entry);
    const row = monitoringByName.get(storedName);
    const status = normalizeMonitoringStatus(row?.status);
    const checkedAgo =
      row?.checked_at && !Number.isNaN(new Date(row.checked_at).getTime())
        ? formatCheckedAgoDa(row.checked_at)
        : null;
    const key = entry.kind === "known" ? entry.system.id : `u-${storedName}`;
    return (
      <SystemCard
        key={key}
        storedName={storedName}
        friendlyName={friendlyName}
        Icon={Icon}
        status={status}
        checkedAgo={checkedAgo}
        onStartSetup={() => openSetupModal(storedName, friendlyName)}
      />
    );
  });

  return (
    <div className="space-y-12 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">Dine IT-systemer</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#2C4A5E]">
          Få overblik over overvågning og status for de systemer, I bruger. Tilføj flere når som helst.
        </p>
      </header>

      {addError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{addError}</p>
      ) : null}

      {activeSection ?? (
        <section>
          <h2 className="text-lg font-semibold text-[#0D1F2D]">Dine systemer</h2>
          <p className="mt-3 text-sm text-[#2C4A5E]">
            Ingen systemer endnu. Tilføj dem du bruger, i sektionen nedenfor.
          </p>
        </section>
      )}

      <section className="space-y-8 border-t border-[#D0E8F5] pt-12">
        <div>
          <h2 className="text-lg font-semibold text-[#0D1F2D]">Tilføj flere systemer</h2>
          <p className="mt-2 text-sm text-[#2C4A5E]">
            Vælg flere platforme vi skal holde øje med. De vises derefter med status som de øvrige.
          </p>
        </div>
        {availableGroups.length === 0 ? (
          <p className="text-sm text-[#7AAEC8]">Alle kendte systemer er allerede på listen.</p>
        ) : (
          availableGroups.map((group) => (
            <div key={group.label} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">{group.label}</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.systems.map((system) => {
                  const Icon = system.icon;
                  const busy = addingName === system.name;
                  return (
                    <SystemCard
                      key={system.id}
                      muted
                      storedName={system.name}
                      friendlyName={friendlyLabel(system.name)}
                      Icon={Icon}
                      status="afventer"
                      checkedAgo={null}
                      extraAction={
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleAdd(system)}
                          className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-50 disabled:opacity-50"
                        >
                          {busy ? "Tilføjer…" : "Tilføj"}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#062840]/40 p-4 sm:items-center"
          onClick={() => setModal(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-sky-100 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="setup-modal-title" className="text-lg font-semibold text-[#0D1F2D]">
                Opsætning af {modal.friendlyName}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full p-1 text-[#7AAEC8] transition-colors hover:bg-[#F5FAFD] hover:text-[#0D1F2D]"
                aria-label="Luk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {modal.kind === "auto" ? (
              <p className="mt-5 flex gap-3 text-sm leading-relaxed text-[#2C4A5E]">
                <Info className="h-5 w-5 shrink-0 text-[#7AAEC8]" aria-hidden />
                <span>Dette system overvåges automatisk. Ingen opsætning kræves.</span>
              </p>
            ) : (
              <>
                <p className="mt-5 text-sm leading-relaxed text-[#2C4A5E]">
                  For at overvåge <strong className="text-[#0D1F2D]">{modal.storedName}</strong> har vi brug for at du
                  sender os adgang. Opret en support-sag og vi hjælper dig igennem opsætningen.
                </p>
                <Link
                  href={supportSetupHref(modal.storedName)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0A6EBD] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0859A0] sm:w-auto"
                >
                  Opret sag om opsætning
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-6 w-full rounded-full border border-sky-200 py-2.5 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-50 sm:w-auto sm:px-6"
            >
              Luk
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
