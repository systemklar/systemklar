"use client";

import Link from "next/link";
import { Info, Package, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { isSelfServiceCredentialSystem } from "@/lib/system-self-service-setup";
import { SystemCredentialSetupModal } from "@/components/portal/SystemCredentialSetupModal";
import { PortalSystemsOverviewRowSkeleton } from "@/components/portal/PortalMonitoringSkeletons";
import { PortalModalOverlay } from "@/components/portal/PortalOverlay";
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

const REMOVE_BLOCKED_TOOLTIP = "Kontakt os for at fjerne et aktivt overvåget system.";

function monitoringBlocksRemove(status: MonitoringStatusKey): boolean {
  return status === "ok" || status === "advarsel" || status === "fejl";
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

function SystemRow({
  storedName,
  friendlyName,
  Icon,
  status,
  checkedAgo,
  onStartSetup,
  showRemove,
  removeBlocked,
  removeConfirmOpen,
  onRemoveClick,
  onRemoveConfirm,
  onRemoveCancel,
  removeBusy,
}: {
  storedName: string;
  friendlyName: string;
  Icon: OnboardingSystem["icon"];
  status: MonitoringStatusKey;
  checkedAgo: string | null;
  onStartSetup?: () => void;
  showRemove?: boolean;
  removeBlocked?: boolean;
  removeConfirmOpen?: boolean;
  onRemoveClick?: () => void;
  onRemoveConfirm?: () => void;
  onRemoveCancel?: () => void;
  removeBusy?: boolean;
}) {
  return (
    <div className="border-b border-[#D0E8F5]/80 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:flex-nowrap">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#0A6EBD]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium text-[#0D1F2D]">{friendlyName}</span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusPillClass(status)}`}
        >
          {customerStatusLabel(status)}
        </span>
        <span className="hidden shrink-0 text-xs text-[#7AAEC8] md:inline md:w-36 md:text-right">
          {checkedAgo ?? "Ingen seneste tjek"}
        </span>
        {status === "afventer" && onStartSetup ? (
          <button
            type="button"
            onClick={onStartSetup}
            className="shrink-0 rounded-full bg-[#0A6EBD] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0859A0]"
          >
            Start opsætning
          </button>
        ) : null}
        {showRemove ? (
          removeBlocked ? (
            <span title={REMOVE_BLOCKED_TOOLTIP} className="inline-flex shrink-0">
              <button
                type="button"
                disabled
                className="cursor-not-allowed text-xs font-medium text-[#7AAEC8]/50"
                aria-label={REMOVE_BLOCKED_TOOLTIP}
              >
                Fjern
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={onRemoveClick}
              disabled={Boolean(removeConfirmOpen)}
              className="shrink-0 text-xs font-medium text-[#7AAEC8] transition-colors hover:text-red-600 disabled:opacity-60"
            >
              Fjern
            </button>
          )
        ) : null}
      </div>
      {removeConfirmOpen ? (
        <div className="pb-2.5 pl-8 text-sm text-[#2C4A5E]">
          Fjern dette system?{" "}
          <button
            type="button"
            disabled={removeBusy}
            onClick={onRemoveConfirm}
            className="font-semibold text-[#0A6EBD] underline-offset-2 hover:underline disabled:opacity-50"
          >
            Ja
          </button>
          {" · "}
          <button
            type="button"
            disabled={removeBusy}
            onClick={onRemoveCancel}
            className="font-semibold text-[#2C4A5E] underline-offset-2 hover:underline disabled:opacity-50"
          >
            Annuller
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SystemsListSection({
  groups,
  renderRow,
}: {
  groups: OnboardingDashboardGroup[];
  renderRow: (entry: ResolvedOnboardingEntry) => ReactNode;
}) {
  if (!groups.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
      {groups.map((group) => (
        <section key={group.shortLabel}>
          <h3 className="border-b border-[#D0E8F5] bg-[#F5FAFD] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">
            {group.groupLabel}
          </h3>
          <div className="px-4">{group.items.map((e) => renderRow(e))}</div>
        </section>
      ))}
    </div>
  );
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
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [removeConfirmFor, setRemoveConfirmFor] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
    setRemoveError(null);
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

  const handleRemoveConfirm = useCallback(
    async (storedName: string) => {
      setRemoveBusy(true);
      setRemoveError(null);
      try {
        const res = await fetch("/api/portal/profile/onboarding-systems/remove", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemName: storedName }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setRemoveError(json.error ?? "Kunne ikke fjerne systemet.");
          return;
        }
        setRemoveConfirmFor(null);
        await reloadUnion();
        await refreshMonitoring();
      } catch {
        setRemoveError("Netværksfejl. Prøv igen.");
      } finally {
        setRemoveBusy(false);
      }
    },
    [reloadUnion, refreshMonitoring],
  );

  const renderRow = (entry: ResolvedOnboardingEntry) => {
    const { storedName, friendlyName, Icon } = entryMeta(entry);
    const key = entry.kind === "known" ? entry.system.id : `u-${storedName}`;
    if (monitoringLoading) {
      return <PortalSystemsOverviewRowSkeleton key={key} />;
    }
    const row = monitoringByName.get(storedName);
    const status = normalizeMonitoringStatus(row?.status);
    const checkedAgo =
      row?.checked_at && !Number.isNaN(new Date(row.checked_at).getTime())
        ? formatCheckedAgoDa(row.checked_at)
        : null;
    const blocked = monitoringBlocksRemove(status);
    return (
      <SystemRow
        key={key}
        storedName={storedName}
        friendlyName={friendlyName}
        Icon={Icon}
        status={status}
        checkedAgo={checkedAgo}
        onStartSetup={() => openSetupModal(storedName, friendlyName)}
        showRemove
        removeBlocked={blocked}
        removeConfirmOpen={removeConfirmFor === storedName}
        onRemoveClick={() => {
          setRemoveError(null);
          setRemoveConfirmFor(storedName);
        }}
        onRemoveConfirm={() => void handleRemoveConfirm(storedName)}
        onRemoveCancel={() => setRemoveConfirmFor(null)}
        removeBusy={removeBusy}
      />
    );
  };

  if (loading) {
    return (
      <div className="w-full p-6 md:p-8">
        <p className="text-sm text-[#7AAEC8]">Indlæser systemer…</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">Dine IT-systemer</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#2C4A5E]">
            Overblik over overvågning og status for de systemer, I bruger.
          </p>
        </div>
        {availableGroups.length > 0 ? (
          <div ref={addMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A6EBD] shadow-sm transition hover:bg-[#F5FAFD]"
              aria-expanded={addOpen}
              aria-haspopup="true"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Tilføj system
            </button>
            {addOpen ? (
              <div
                className="absolute right-0 z-40 mt-2 max-h-[min(24rem,70vh)] w-[min(100vw-2rem,22rem)] overflow-y-auto rounded-xl border border-sky-100 bg-white py-2 shadow-lg"
                role="menu"
              >
                {availableGroups.map((group) => (
                  <div key={group.label} className="px-2 py-1">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.systems.map((system) => {
                        const busy = addingName === system.name;
                        return (
                          <li
                            key={system.id}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F5FAFD]"
                          >
                            <span className="min-w-0 flex-1 text-sm text-[#0D1F2D]">
                              {friendlyLabel(system.name)}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleAdd(system)}
                              className="shrink-0 rounded-full border border-[#0A6EBD]/30 px-2.5 py-0.5 text-xs font-semibold text-[#0A6EBD] transition hover:bg-[#F5FAFD] disabled:opacity-50"
                            >
                              {busy ? "…" : "Tilføj"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {addError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{addError}</p>
      ) : null}
      {removeError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{removeError}</p>
      ) : null}

      {activeGroups.length > 0 ? (
        <SystemsListSection groups={activeGroups} renderRow={renderRow} />
      ) : (
        <p className="rounded-xl border border-sky-100 bg-white px-5 py-8 text-center text-sm text-[#2C4A5E] shadow-sm">
          Ingen systemer endnu. Brug <strong className="text-[#0A6EBD]">+ Tilføj system</strong> for at komme i gang.
        </p>
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

      {modal ? (
        <PortalModalOverlay open onClose={() => setModal(null)} position="bottom-sheet">
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
                  Denne integration kræver at vi hjælper dig med opsætningen. Opret en sag og vi sørger for resten.
                </p>
                <Link
                  href={supportSetupHref(modal.storedName)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0A6EBD] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0859A0] sm:w-auto"
                >
                  Opret sag
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
        </PortalModalOverlay>
      ) : null}
    </div>
  );
}
