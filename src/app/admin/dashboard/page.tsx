"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type DashboardStats = {
  customers: number | null;
  ticketsActive: number | null;
  ticketsResolved: number | null;
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
    ticketsActive: null,
    ticketsResolved: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [customersRes, activeRes, resolvedRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    ]);

    if (customersRes.error) {
      console.error("[admin/dashboard] profiles count", customersRes.error);
    }
    if (activeRes.error) {
      console.error("[admin/dashboard] tickets active", activeRes.error);
    }
    if (resolvedRes.error) {
      console.error("[admin/dashboard] tickets resolved", resolvedRes.error);
    }

    setStats({
      customers: customersRes.error ? null : (customersRes.count ?? 0),
      ticketsActive: activeRes.error ? null : (activeRes.count ?? 0),
      ticketsResolved: resolvedRes.error ? null : (resolvedRes.count ?? 0),
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
            title="Aktive sager"
            value={stats.ticketsActive}
            hint="Status: aktiv"
            href="/admin/tickets"
          />
          <StatCard
            title="Løste sager"
            value={stats.ticketsResolved}
            hint="Status: løst"
            href="/admin/tickets"
          />
        </div>
      )}
    </div>
  );
}
