"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Monitor } from "lucide-react";
import { onboardingFirstName } from "@/lib/onboarding";
import { buildOnboardingDashboardGroups } from "@/lib/onboarding-systems";

const PENDING_SETUP_CLASS =
  "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600";

type PortalSystemsDashboardProps = {
  fullName: string | null;
  onboardingSystemNames: string[];
  /** Skjul primær CTA (admin-forhåndsvisning). */
  preview?: boolean;
};

export function PortalSystemsDashboard({
  fullName,
  onboardingSystemNames,
  preview = false,
}: PortalSystemsDashboardProps) {
  const firstName = onboardingFirstName(fullName);
  const groups = useMemo(
    () => buildOnboardingDashboardGroups(onboardingSystemNames),
    [onboardingSystemNames],
  );
  const hasSystems = groups.length > 0;

  return (
    <div className="space-y-12 pb-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D] sm:text-3xl">
            Goddag, {firstName}
          </h1>
          {!preview ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4A8CB5]">
              Her ser du de systemer, vi sammen har valgt — og du kan altid oprette en sag, hvis du har brug for hjælp.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#4A8CB5]">Forhåndsvisning af kundens portal-overblik.</p>
          )}
        </div>
        {!preview ? (
          <Link
            href="/portal/support"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Opret IT-sag
          </Link>
        ) : null}
      </div>

      <section className="space-y-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#0D1F2D]">Dine systemer</h2>

        {!hasSystems ? (
          <div className="rounded-2xl border border-dashed border-sky-100 bg-white/60 px-8 py-16 text-center shadow-sm">
            <p className="mx-auto max-w-md text-base leading-relaxed text-[#2C4A5E]">
              Dine systemer er ved at blive sat op. Vi vender tilbage inden for 24 timer.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <div key={group.shortLabel}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#7AAEC8]">
                  {group.shortLabel}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((entry, idx) => {
                    const Icon = entry.kind === "known" ? entry.system.icon : Monitor;
                    const name = entry.kind === "known" ? entry.system.name : entry.name;
                    const key =
                      entry.kind === "known" ? entry.system.id : `u-${group.shortLabel}-${name}-${idx}`;
                    return (
                      <article
                        key={key}
                        className="flex flex-col rounded-2xl border border-sky-100/90 bg-white p-6 shadow-sm"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F7FF] text-sky-600">
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        </div>
                        <p className="mt-5 text-base font-semibold leading-snug text-[#0D1F2D]">{name}</p>
                        <span className={`mt-auto pt-5 ${PENDING_SETUP_CLASS}`}>Afventer opsætning</span>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!preview ? (
        <footer className="border-t border-sky-100/80 pt-8">
          <p className="text-center text-sm text-[#4A8CB5]">
            <Link href="/portal/support" className="font-semibold text-sky-700 hover:underline">
              Support &amp; sager
            </Link>
            <span className="mx-2 text-sky-200" aria-hidden>
              ·
            </span>
            <Link href="/portal/systemer" className="font-semibold text-sky-700 hover:underline">
              Driftssystemer
            </Link>
          </p>
        </footer>
      ) : null}
    </div>
  );
}
