"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/tickets/StatusBadge";
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
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
        {value === null ? "—" : value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
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
  const [recentTickets, setRecentTickets] = useState<
    { id: string; title: string; status: string; created_at: string }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);

    const [customersRes, activeRes, resolvedRes, recentRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("tickets").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(8),
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
    setRecentTickets(
      ((recentRes.data ?? []) as { id: string; title: string; status: string; created_at: string }[]) ?? [],
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Overblik</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Velkommen til admin-dashboardet. Her ser du hurtige nøgletal for kunder og supportsager.
        </p>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter tal...</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seneste supportsager</h2>
          <Link href="/admin/tickets" className="text-sm font-semibold text-blue-600 hover:underline">
            Åbn alle
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Ingen sager endnu</p>
            <p className="mt-1 text-sm text-slate-500">Nye supportsager vil dukke op her.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Titel</th>
                  <th className="px-4 py-3 font-medium">Dato</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${t.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(t.created_at))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
