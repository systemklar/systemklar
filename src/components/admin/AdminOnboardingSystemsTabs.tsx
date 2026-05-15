"use client";

import { Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildOnboardingDashboardGroups } from "@/lib/onboarding-systems";
import {
  MonitoringStatusInline,
  monitoringResultsBySystemName,
  type MonitoringResultRow,
} from "@/components/monitoring/MonitoringStatusBlock";

type AdminOnboardingSystemsTabsProps = {
  storedNames: string[];
  organisationId: string;
};

export function AdminOnboardingSystemsTabs({ storedNames, organisationId }: AdminOnboardingSystemsTabsProps) {
  const groups = useMemo(() => buildOnboardingDashboardGroups(storedNames), [storedNames]);
  const [activeShortLabel, setActiveShortLabel] = useState(groups[0]?.shortLabel ?? "");
  const [monitoringByName, setMonitoringByName] = useState<Map<string, MonitoringResultRow>>(() => new Map());

  const activeGroupKey = useMemo(() => {
    if (groups.some((g) => g.shortLabel === activeShortLabel)) return activeShortLabel;
    return groups[0]?.shortLabel ?? "";
  }, [groups, activeShortLabel]);

  useEffect(() => {
    const oid = organisationId?.trim();
    if (!oid) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (!cancelled) setMonitoringByName(new Map());
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/monitoring/${encodeURIComponent(oid)}`, {
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
  }, [organisationId]);

  if (groups.length === 0) return null;

  const activeGroup = groups.find((g) => g.shortLabel === activeGroupKey) ?? groups[0];

  return (
    <div className="rounded-2xl border border-sky-100 bg-white shadow-sm">
      <div className="border-b border-sky-50 px-2 pt-2 sm:px-4">
        <nav className="-mb-px flex flex-wrap gap-1" aria-label="Systemkategorier">
          {groups.map((g) => {
            const isActive = g.shortLabel === activeGroupKey;
            return (
              <button
                key={g.shortLabel}
                type="button"
                onClick={() => setActiveShortLabel(g.shortLabel)}
                className={`whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-b-0 border-sky-100 bg-white text-sky-800"
                    : "text-[#4A8CB5] hover:bg-sky-50/80 hover:text-sky-800"
                }`}
              >
                {g.shortLabel}
              </button>
            );
          })}
        </nav>
      </div>

      <ul className="divide-y divide-sky-50 px-4 sm:px-6">
        {activeGroup.items.map((entry, idx) => {
          const Icon = entry.kind === "known" ? entry.system.icon : Monitor;
          const name = entry.kind === "known" ? entry.system.name : entry.name;
          const key =
            entry.kind === "known" ? entry.system.id : `u-${activeGroup.shortLabel}-${name}-${idx}`;
          return (
            <li key={key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF] text-sky-600">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-medium text-[#0D1F2D]">{name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                <MonitoringStatusInline
                  systemName={name}
                  row={monitoringByName.get(name) ?? null}
                />
                <span className="hidden w-16 text-right text-xs text-slate-300 sm:inline" title="Kommende handlinger">
                  ···
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
