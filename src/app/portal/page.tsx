"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { createClient } from "@/lib/supabase";

type SystemRow = {
  id: string;
  name: string;
  status: "ok" | "advarsel" | "nede";
  type: string;
};

const statusStyles: Record<SystemRow["status"], string> = {
  ok: "bg-emerald-100 text-emerald-800",
  advarsel: "bg-amber-100 text-amber-900",
  nede: "bg-red-100 text-red-800",
};

function DashboardContent() {
  const session = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSystemsLoading(true);
      const { data, error } = await supabase
        .from("systems")
        .select("id, name, status, type")
        .order("created_at", { ascending: false })
        .limit(4);
      if (cancelled) return;
      if (error) {
        setSystems([]);
      } else {
        setSystems((data ?? []) as SystemRow[]);
      }
      setSystemsLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const hasDown = systems.some((s) => s.status === "nede");

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-3xl font-bold">Velkommen til dashboardet</h1>
        <p className="mt-3 text-slate-600">
          Du er logget ind som{" "}
          <span className="font-semibold">{session?.email ?? "…"}</span>.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Mine systemer</h2>
          <Link href="/portal/systemer" className="text-sm font-semibold text-emerald-700 hover:underline">
            Se alle
          </Link>
        </div>
        {hasDown ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Advarsel: Et eller flere systemer er nede.
          </p>
        ) : null}
        {systemsLoading ? (
          <p className="mt-4 text-sm text-slate-500">Henter systemer...</p>
        ) : systems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Ingen systemer endnu.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {systems.map((s) => (
              <article key={s.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="mt-1 text-xs text-slate-500">{s.type}</p>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[s.status]}`}>
                  {s.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">IT-overblik</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: samlet status over systemer, enheder og drift.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Åbne sager</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: aktive supportsager med status og prioritet.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Seneste rapport</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: månedlig IT-rapport med nøgletal og anbefalinger.
          </p>
        </article>
      </div>
    </>
  );
}

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <DashboardContent />
    </PortalLayout>
  );
}
