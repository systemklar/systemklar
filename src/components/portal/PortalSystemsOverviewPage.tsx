"use client";

import Link from "next/link";
import { Info, Package, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePortalSession } from "@/components/portal/PortalLayout";
import {
  formatCheckedAgoDa,
  monitoringResultsBySystemName,
  type MonitoringResultRow,
} from "@/components/monitoring/MonitoringStatusBlock";
import { fetchCurrentProfile, normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import {
  monitoringCustomerExplanation,
  normalizeMonitoringStatus,
  type MonitoringStatusKey,
} from "@/lib/monitoring/monitoring-dashboard-copy";
import { isAutoMonitoredCustomerSystem } from "@/lib/monitoring/monitoring-system-names";
import { isSelfServiceCredentialSystem } from "@/lib/system-self-service-setup";
import { SystemCredentialSetupModal } from "@/components/portal/SystemCredentialSetupModal";
import {
  PortalSystemsOverviewCardSkeleton,
} from "@/components/portal/PortalMonitoringSkeletons";
import { PortalSlideInPanel } from "@/components/portal/PortalOverlay";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { PortalSystemCard } from "@/components/portal/PortalSystemCard";
import {
  buildOnboardingDashboardGroups,
  ONBOARDING_SYSTEM_GROUPS,
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

type SetupModal =
  | { kind: "manual"; storedName: string; friendlyName: string }
  | { kind: "auto"; friendlyName: string };

type DetailPanel = {
  storedName: string;
  friendlyName: string;
  status: MonitoringStatusKey;
  checkedAgo: string | null;
};

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

export function PortalSystemsOverviewPage() {
  const portalSession = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [unionNames, setUnionNames] = useState<string[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(() => new Map());
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [modal, setModal] = useState<SetupModal | null>(null);
  const [credentialModal, setCredentialModal] = useState<{
    storedName: string;
    friendlyName: string;
  } | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null);

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
      setMonitoringLoading(false);
      return;
    }
    let cancelled = false;
    setMonitoringLoading(true);
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
      } finally {
        if (!cancelled) setMonitoringLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  useEffect(() => {
    if (!addOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [addOpen]);

  const unionSet = useMemo(() => new Set(unionNames), [unionNames]);
  const activeGroups = useMemo(() => buildOnboardingDashboardGroups(unionNames), [unionNames]);
  const activeEntries = useMemo(
    () => activeGroups.flatMap((g) => g.items),
    [activeGroups],
  );

  const availableGroups = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    return ONBOARDING_SYSTEM_GROUPS.map((g) => ({
      ...g,
      systems: g.systems.filter((s) => {
        if (unionSet.has(s.name)) return false;
        if (!q) return true;
        return friendlyLabel(s.name).toLowerCase().includes(q);
      }),
    })).filter((g) => g.systems.length > 0);
  }, [unionSet, addSearch]);

  const openSetupModal = (storedName: string, friendlyName: string) => {
    if (isAutoMonitoredCustomerSystem(storedName)) {
      setModal({ kind: "auto", friendlyName });
    } else if (isSelfServiceCredentialSystem(storedName)) {
      if (!orgId) {
        setAddError("Din organisation mangler — kontakt os for at opsætte integrationen.");
        return;
      }
      setCredentialModal({ storedName, friendlyName });
    } else {
      setModal({ kind: "manual", storedName, friendlyName });
    }
  };

  const refreshMonitoring = useCallback(async () => {
    const oid = orgId?.trim();
    if (!oid) {
      setMonitoringByName(new Map());
      setMonitoringLoading(false);
      return;
    }
    setMonitoringLoading(true);
    try {
      const mon = await fetch(`/api/monitoring/${encodeURIComponent(oid)}`, { credentials: "include" });
      if (mon.ok) {
        const data = (await mon.json()) as { results?: MonitoringResultRow[] };
        setMonitoringByName(monitoringResultsBySystemName(data.results ?? []));
      }
    } catch {
      /* ignore */
    } finally {
      setMonitoringLoading(false);
    }
  }, [orgId]);

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
      if (orgId) await refreshMonitoring();
      setAddOpen(false);
      setAddSearch("");
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

  const addButton = (
      <div ref={addMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E4490]"
          aria-expanded={addOpen}
          aria-haspopup="true"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tilføj system
        </button>
        {addOpen ? (
          <div
            className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-2xl border border-[#CBD5E8] bg-white shadow-[0_16px_48px_rgba(10,22,40,0.12)]"
            role="menu"
          >
            <div className="border-b border-[#E4EAF5] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#CBD5E8] bg-[#F2F5FA] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-[#6A82A8]" aria-hidden />
                <input
                  type="search"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Søg efter system..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#0A1628] outline-none placeholder:text-[#6A82A8]"
                />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto py-2">
              {availableGroups.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#6A82A8]">Ingen systemer matcher søgningen.</p>
              ) : (
                availableGroups.map((group) => (
                  <div key={group.label} className="px-2 py-1">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#6A82A8]">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.systems.map((system) => {
                        const busy = addingName === system.name;
                        const Icon = system.icon;
                        return (
                          <li
                            key={system.id}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-[#F2F5FA]"
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <Icon className="h-5 w-5 shrink-0 text-[#2952A3]" aria-hidden />
                              <span className="text-sm text-[#0A1628]">{friendlyLabel(system.name)}</span>
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleAdd(system)}
                              className="shrink-0 rounded-full bg-[#2952A3] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#1E4490] disabled:opacity-50"
                            >
                              {busy ? "…" : "Tilføj"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
  );

  if (loading) {
    return (
      <PortalPageShell title="Dine IT-systemer" subtitle="Overblik over overvågning og status">
        <p className="text-sm text-[#6A82A8]">Indlæser systemer…</p>
      </PortalPageShell>
    );
  }

  const detailRow = detailPanel ? monitoringByName.get(detailPanel.storedName) : undefined;

  return (
    <PortalPageShell
      title="Dine IT-systemer"
      subtitle="Overblik over overvågning og status"
      action={addButton}
    >
      {addError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{addError}</p>
      ) : null}

      {activeEntries.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeEntries.map((entry) => {
            const { storedName, friendlyName, Icon } = entryMeta(entry);
            const key = entry.kind === "known" ? entry.system.id : `u-${storedName}`;
            if (monitoringLoading) {
              return (
                <li key={key}>
                  <PortalSystemsOverviewCardSkeleton />
                </li>
              );
            }
            const row = monitoringByName.get(storedName);
            const status = normalizeMonitoringStatus(row?.status);
            const checkedAgo =
              row?.checked_at && !Number.isNaN(new Date(row.checked_at).getTime())
                ? formatCheckedAgoDa(row.checked_at)
                : null;
            return (
              <li key={key}>
                <PortalSystemCard
                  friendlyName={friendlyName}
                  Icon={Icon}
                  status={status}
                  checkedAgo={checkedAgo}
                  onSetup={
                    status === "afventer"
                      ? () => openSetupModal(storedName, friendlyName)
                      : undefined
                  }
                  onDetails={
                    status !== "afventer"
                      ? () => setDetailPanel({ storedName, friendlyName, status, checkedAgo })
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-[#CBD5E8] bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-[#0A1628]">Ingen systemer endnu</p>
          <p className="mt-2 text-sm text-[#2A4868]">
            Tilføj dit første system for at starte overvågning.
          </p>
          {availableGroups.length > 0 ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1E4490]"
            >
              <Plus className="h-4 w-4" />
              Tilføj system
            </button>
          ) : null}
        </div>
      )}

      {credentialModal && orgId ? (
        <SystemCredentialSetupModal
          systemName={credentialModal.storedName}
          friendlyName={credentialModal.friendlyName}
          organisationId={orgId}
          onClose={() => setCredentialModal(null)}
          onVerified={() => void refreshMonitoring()}
        />
      ) : null}

      <PortalSlideInPanel open={modal != null} onClose={() => setModal(null)} panelClassName="max-w-lg">
        {modal ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[#CBD5E8] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#0A1628]">Opsætning af {modal.friendlyName}</h2>
                <p className="mt-1 text-xs text-[#6A82A8]">Trin 1 af 1</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full p-1 text-[#6A82A8] transition hover:bg-[#F2F5FA] hover:text-[#0A1628]"
                aria-label="Luk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-1.5 px-6 pt-4">
              <span className="h-1 flex-1 rounded-full bg-[#2952A3]" />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {modal.kind === "auto" ? (
                <p className="flex gap-3 text-sm leading-relaxed text-[#2A4868]">
                  <Info className="h-5 w-5 shrink-0 text-[#6A82A8]" aria-hidden />
                  <span>Dette system overvåges automatisk. Ingen opsætning kræves.</span>
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-[#2A4868]">
                    Denne integration kræver hjælp fra vores team. Opret en sag, så klarer vi opsætningen.
                  </p>
                  <ol className="mt-6 space-y-3 text-sm text-[#2A4868]">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8EEFC] text-xs font-semibold text-[#2952A3]">
                        1
                      </span>
                      Opret en support-sag med systemnavnet
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8EEFC] text-xs font-semibold text-[#2952A3]">
                        2
                      </span>
                      Vi kontakter dig med næste skridt
                    </li>
                  </ol>
                  <Link
                    href={supportSetupHref(modal.storedName)}
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#2952A3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1E4490]"
                  >
                    Opret sag
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </PortalSlideInPanel>

      <PortalSlideInPanel open={detailPanel != null} onClose={() => setDetailPanel(null)} panelClassName="max-w-md">
        {detailPanel ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[#CBD5E8] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#0A1628]">{detailPanel.friendlyName}</h2>
                <p className="mt-1 text-xs text-[#6A82A8]">Systemstatus</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailPanel(null)}
                className="rounded-full p-1 text-[#6A82A8] transition hover:bg-[#F2F5FA]"
                aria-label="Luk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-sm text-[#2A4868]">
                {monitoringCustomerExplanation(
                  detailPanel.storedName,
                  detailPanel.status,
                  detailRow?.details,
                )}
              </p>
              {detailPanel.checkedAgo ? (
                <p className="mt-4 text-xs text-[#6A82A8]">Tjekket for {detailPanel.checkedAgo}</p>
              ) : null}
              {(detailPanel.status === "advarsel" || detailPanel.status === "fejl") && (
                <Link
                  href="/portal/support/new"
                  className="mt-8 inline-flex rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E4490]"
                >
                  Opret support-sag
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </PortalSlideInPanel>
    </PortalPageShell>
  );
}
