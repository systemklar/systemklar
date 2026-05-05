"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { StatusBadge } from "@/components/tickets/StatusBadge";
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
  const [recentTickets, setRecentTickets] = useState<
    { id: string; title: string; status: string; created_at: string }[]
  >([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSystemsLoading(true);
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const user = authSession?.user;
      if (!user) return;
      const [systemsRes, ticketsRes, companyRes] = await Promise.all([
        supabase.from("systems").select("id, name, status, type").order("created_at", { ascending: false }).limit(4),
        supabase
          .from("tickets")
          .select("id,title,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("profiles").select("company_name").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      if (systemsRes.error) {
        setSystems([]);
      } else {
        setSystems((systemsRes.data ?? []) as SystemRow[]);
      }
      setRecentTickets(
        ((ticketsRes.data ?? []) as { id: string; title: string; status: string; created_at: string }[]) ?? [],
      );
      setCompanyName(
        companyRes.data?.company_name && companyRes.data.company_name.trim()
          ? companyRes.data.company_name.trim()
          : null,
      );
      setSystemsLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const hasDown = systems.some((s) => s.status === "nede");
  const today = new Intl.DateTimeFormat("da-DK", { dateStyle: "full" }).format(new Date());
  const greetingName = companyName ?? session?.email ?? "der";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm text-slate-500">{today}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Goddag, {greetingName} 👋</h1>
        <p className="mt-3 text-slate-600">Her er dagens overblik over systemstatus, handlinger og seneste sager.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-2xl">🖥️</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Ingen systemer endnu</p>
            <p className="mt-1 text-sm text-slate-500">Tilføj jeres systemer for at få status-overblik.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {systems.map((s) => (
              <article key={s.id} className="rounded-xl border border-slate-200 p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <span className="text-lg" aria-hidden>
                    {s.status === "ok" ? "🟢" : s.status === "advarsel" ? "🟡" : "🔴"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{s.type}</p>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[s.status]}`}>
                  {s.status === "ok" ? "Aktiv" : s.status === "advarsel" ? "Advarsel" : "Nede"}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Opret sag", href: "/portal/support", text: "Få hurtig hjælp fra supportteamet.", icon: "🎫" },
          { title: "Se systemer", href: "/portal/systemer", text: "Følg drift og status i realtid.", icon: "🖥️" },
          { title: "Åbn kodebank", href: "/portal/kodebank", text: "Gem og find login-oplysninger sikkert.", icon: "🔐" },
        ].map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-2xl">{card.icon}</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{card.text}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Seneste sager</h2>
          <Link href="/portal/support" className="text-sm font-semibold text-emerald-700 hover:underline">
            Se alle
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Ingen sager endnu</p>
            <p className="mt-1 text-sm text-slate-500">Opret en sag hvis du har brug for hjælp.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recentTickets.map((t) => (
              <li key={t.id}>
                <Link href={`/portal/support/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(t.created_at))}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <DashboardContent />
    </PortalLayout>
  );
}
