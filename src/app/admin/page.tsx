"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type DashboardStats = {
  customers: number | null;
  ticketsOpen: number | null;
  ticketsInProgress: number | null;
};

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: number | null;
  hint: string;
  href?: string;
}) {
  const inner = (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
        {value === null ? "—" : value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
        {inner}
      </Link>
    );
  }

  return inner;
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<DashboardStats>({
    customers: null,
    ticketsOpen: null,
    ticketsInProgress: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // Kunder: alle rækker i `profiles`. Tickets: alle rækker i `tickets` med given status.
    const [customersRes, openRes, progressRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    ]);

    if (customersRes.error) {
      console.error("[admin/dashboard] profiles count", customersRes.error);
    }
    if (openRes.error) {
      console.error("[admin/dashboard] tickets open", openRes.error);
    }
    if (progressRes.error) {
      console.error("[admin/dashboard] tickets in_progress", progressRes.error);
    }

    setStats({
      customers: customersRes.error ? null : (customersRes.count ?? 0),
      ticketsOpen: openRes.error ? null : (openRes.count ?? 0),
      ticketsInProgress: progressRes.error ? null : (progressRes.count ?? 0),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Overblik</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Velkommen til admin-dashboardet. Her ser du hurtige nøgletal for kunder og supportsager.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter tal...</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Kunder"
            value={stats.customers}
            hint="Antal rækker i profiler"
            href="/admin/customers"
          />
          <StatCard
            title="Åbne tickets"
            value={stats.ticketsOpen}
            hint="Status: åben"
            href="/admin/tickets"
          />
          <StatCard
            title="I gang"
            value={stats.ticketsInProgress}
            hint="Status: i gang"
            href="/admin/tickets"
          />
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        Brug menuen til venstre for at administrere kunder og supportsager.
      </div>
    </div>
  );
}
