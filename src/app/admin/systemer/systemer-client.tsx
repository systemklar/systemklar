"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  ADMIN_SYSTEM_CATEGORY_TABS,
  getAdminSystemReference,
  integrationTypeLabel,
  monitoringStatusLabel,
  systemMatchesCategory,
  systemMatchesSearch,
  type AdminSystemCategoryTab,
  type AdminSystemReference,
  type SystemUsageByName,
} from "@/lib/admin-system-reference";
import { ALL_ONBOARDING_SYSTEMS, type OnboardingSystem } from "@/lib/onboarding-systems";

type CatalogEntry = {
  system: OnboardingSystem;
  reference: AdminSystemReference;
  customerCount: number;
};

function monitoringStatusStyles(status: AdminSystemReference["monitoringStatus"]) {
  if (status === "active") {
    return {
      dot: "bg-[#6A8F5A]",
      badge: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
    };
  }
  if (status === "pending") {
    return {
      dot: "bg-[#A8A090]",
      badge: "bg-slate-100 text-slate-700 ring-slate-200/80",
    };
  }
  return {
    dot: "bg-[#B85C4A]",
    badge: "bg-red-50 text-red-800 ring-red-200/80",
  };
}

function ExternalHref({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[#D4C9A8] px-2.5 py-1 text-xs font-semibold text-[#8B9E6B] transition hover:bg-[#EEF2E6]"
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  );
}

function SystemDetailPanel({
  entry,
  customers,
  onClose,
}: {
  entry: CatalogEntry;
  customers: { organisationId: string; organisationName: string }[];
  onClose: () => void;
}) {
  const { system, reference } = entry;
  const Icon = system.icon;
  const statusStyle = monitoringStatusStyles(reference.monitoringStatus);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        aria-label="Luk panel"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-detail-title"
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-[#D4C9A8] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#D4C9A8] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2E6] text-[#8B9E6B]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="system-detail-title" className="text-lg font-bold text-[#2C3E2A]">
                {system.name}
              </h2>
              <p className="mt-0.5 text-sm text-[#5C5A48]">{reference.categoryShortLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5C5A48] hover:bg-[#EEF2E6]"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[#EEF2E6] px-2.5 py-0.5 text-xs font-semibold text-[#2C3E2A]">
              {reference.categoryShortLabel}
            </span>
            <span className="inline-flex rounded-full bg-[#EEF2E6] px-2.5 py-0.5 text-xs font-semibold text-[#8B9E6B]">
              {integrationTypeLabel(reference.integrationType)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusStyle.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} aria-hidden />
              {monitoringStatusLabel(reference.monitoringStatus)}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#5C5A48]">{reference.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-[#5C5A48]">Integration</dt>
              <dd className="mt-0.5 font-medium text-[#2C3E2A]">
                {integrationTypeLabel(reference.integrationType)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5C5A48]">Sværhedsgrad</dt>
              <dd className="mt-0.5 font-medium capitalize text-[#2C3E2A]">
                {reference.integrationDifficulty}
              </dd>
            </div>
          </dl>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5C5A48]">
              Opsætningsnoter (intern)
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#5C5A48]">
              {reference.adminSetupNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5C5A48]">
              Links
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {reference.supportUrl ? (
                <ExternalHref href={reference.supportUrl} label="Support" />
              ) : null}
              {reference.docsUrl ? (
                <ExternalHref href={reference.docsUrl} label="API docs" />
              ) : null}
              {reference.statusUrl ? (
                <ExternalHref href={reference.statusUrl} label="Status" />
              ) : null}
              {reference.setupGuideUrl ? (
                <ExternalHref href={reference.setupGuideUrl} label="Opsætningsguide" />
              ) : reference.docsUrl ? (
                <ExternalHref href={reference.docsUrl} label="Opsætningsguide" />
              ) : null}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5C5A48]">
              Kunder med dette system ({customers.length})
            </h3>
            {customers.length === 0 ? (
              <p className="mt-2 text-sm text-[#5C5A48]">Ingen kunder har valgt dette system endnu.</p>
            ) : (
              <ul className="mt-2 divide-y divide-[#E8E2D0] rounded-xl border border-[#D4C9A8]">
                {customers.map((c) => (
                  <li key={c.organisationId}>
                    <Link
                      href={`/admin/customers/${c.organisationId}`}
                      className="block px-3 py-2.5 text-sm font-medium text-[#8B9E6B] hover:bg-[#EEF2E6]"
                    >
                      {c.organisationName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function SystemCard({
  entry,
  onSelect,
}: {
  entry: CatalogEntry;
  onSelect: () => void;
}) {
  const { system, reference, customerCount } = entry;
  const Icon = system.icon;
  const statusStyle = monitoringStatusStyles(reference.monitoringStatus);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col rounded-2xl border border-[#D4C9A8] bg-white p-5 text-left shadow-sm transition hover:border-[#D4C9A8] hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2E6] text-[#8B9E6B]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#2C3E2A]">{system.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-[#EEF2E6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5C5A48]">
              {reference.categoryShortLabel}
            </span>
            <span className="inline-flex rounded-full bg-[#EEF2E6] px-2 py-0.5 text-[10px] font-semibold text-[#8B9E6B]">
              {integrationTypeLabel(reference.integrationType)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-[#5C5A48]">
        {customerCount === 1 ? "1 kunde bruger dette" : `${customerCount} kunder bruger dette`}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {reference.supportUrl ? (
          <ExternalHref href={reference.supportUrl} label="Support" />
        ) : null}
        {reference.docsUrl ? <ExternalHref href={reference.docsUrl} label="API docs" /> : null}
        {reference.setupGuideUrl || reference.docsUrl ? (
          <ExternalHref
            href={reference.setupGuideUrl ?? reference.docsUrl!}
            label="Opsætningsguide"
          />
        ) : null}
      </div>

      <p
        className={`mt-4 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} aria-hidden />
        {monitoringStatusLabel(reference.monitoringStatus)}
      </p>
    </button>
  );
}

export default function AdminSystemerClient() {
  const [usageByName, setUsageByName] = useState<SystemUsageByName>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AdminSystemCategoryTab>("Alle");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/system-reference", { credentials: "same-origin" });
    const payload = (await res.json().catch(() => ({}))) as {
      usageByName?: SystemUsageByName;
      error?: string;
    };
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke hente systemdata.");
      setUsageByName({});
    } else {
      setUsageByName(payload.usageByName ?? {});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const catalog = useMemo<CatalogEntry[]>(() => {
    return ALL_ONBOARDING_SYSTEMS.map((system) => {
      const reference = getAdminSystemReference(system);
      const usage = usageByName[system.name];
      return {
        system,
        reference,
        customerCount: usage?.count ?? 0,
      };
    });
  }, [usageByName]);

  const filtered = useMemo(() => {
    return catalog.filter((entry) => {
      if (!systemMatchesCategory(entry.reference, category)) return false;
      return systemMatchesSearch(entry.system, entry.reference, search);
    });
  }, [catalog, category, search]);

  const selectedEntry = useMemo(
    () => (selectedId ? catalog.find((e) => e.system.id === selectedId) ?? null : null),
    [catalog, selectedId],
  );

  const selectedCustomers = selectedEntry
    ? usageByName[selectedEntry.system.name]?.customers ?? []
    : [];

  return (
    <div>
      <div className="border-b border-[#D4C9A8] pb-6">
        <p className="mb-1 text-xs text-[#5C5A48]">Admin</p>
        <h1 className="text-2xl font-bold text-[#2C3E2A]">Systemreference</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5C5A48]">
          Overblik over alle systemer kunder kan overvåge — support, dokumentation og hvilke kunder der
          bruger hvert system.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5A48]"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg efter system..."
            className="w-full rounded-xl border border-[#D4C9A8] bg-white py-3 pl-10 pr-4 text-sm text-[#2C3E2A] outline-none transition focus:border-[#8B9E6B] focus:ring-2 focus:ring-[#8B9E6B]/20"
          />
        </label>

        <nav className="-mb-px flex flex-wrap gap-1 border-b border-[#D4C9A8] pb-px" aria-label="Kategorier">
          {ADMIN_SYSTEM_CATEGORY_TABS.map((tab) => {
            const active = category === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-b-2 border-[#8B9E6B] text-[#8B9E6B]"
                    : "text-[#5C5A48] hover:bg-[#EEF2E6] hover:text-[#2C3E2A]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-[#5C5A48]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Henter systemer…
        </p>
      ) : error ? (
        <p className="mt-8 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-[#5C5A48]">Ingen systemer matcher din søgning.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <SystemCard key={entry.system.id} entry={entry} onSelect={() => setSelectedId(entry.system.id)} />
          ))}
        </div>
      )}

      {selectedEntry ? (
        <SystemDetailPanel
          entry={selectedEntry}
          customers={selectedCustomers}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
