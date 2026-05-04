"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomerStatusBadge } from "@/components/admin/CustomerStatusBadge";
import { PlanBadge, type ProfilePlan } from "@/components/admin/PlanBadge";
import { formatDanishDateTime, StatusBadge, type TicketStatus } from "@/components/tickets/StatusBadge";
import { createClient } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  email: string;
  company_name: string;
  plan: string;
  status: string;
  created_at: string;
  user_id: string | null;
};

type TicketRow = {
  id: string;
  title: string;
  status: TicketStatus;
  created_at: string;
};

export default function AdminCustomerDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setPlanError(null);

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, company_name, plan, status, created_at, user_id")
      .eq("id", id)
      .maybeSingle();

    if (pErr || !prof) {
      console.error("[admin/customer] profile", pErr);
      setProfile(null);
      setTickets([]);
      setLoading(false);
      return;
    }

    const row = prof as ProfileRow;
    setProfile(row);

    if (row.user_id) {
      const { data: tix, error: tErr } = await supabase
        .from("tickets")
        .select("id, title, status, created_at")
        .eq("user_id", row.user_id)
        .order("created_at", { ascending: false });

      if (tErr) {
        console.error("[admin/customer] tickets", tErr);
        setTickets([]);
      } else {
        setTickets((tix ?? []) as TicketRow[]);
      }
    } else {
      setTickets([]);
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const handlePlanChange = async (next: ProfilePlan) => {
    if (!profile) return;
    setPlanSaving(true);
    setPlanError(null);

    const { error } = await supabase.from("profiles").update({ plan: next }).eq("id", profile.id);

    if (error) {
      console.error("[admin/customer] plan update", error);
      setPlanError(error.message);
    } else {
      setProfile({ ...profile, plan: next });
    }
    setPlanSaving(false);
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Indlæser kunde...</p>;
  }

  if (!profile) {
    return (
      <div>
        <Link href="/admin/customers" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til kunder
        </Link>
        <p className="mt-6 text-sm text-slate-600">Kunde ikke fundet.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/customers" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Tilbage til kunder
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.company_name}</h1>
            <p className="mt-2 text-slate-700">{profile.email}</p>
            <p className="mt-3 text-sm text-slate-500">
              Oprettet {formatDanishDateTime(profile.created_at)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CustomerStatusBadge status={profile.status} />
              <PlanBadge plan={profile.plan} />
            </div>
            {profile.user_id ? (
              <p className="mt-3 font-mono text-xs text-slate-500">Bruger-id: {profile.user_id}</p>
            ) : (
              <p className="mt-3 text-sm text-amber-800">
                Ingen tilknyttet portal-bruger (<code className="rounded bg-amber-50 px-1">user_id</code> er tom).
                Tickets vises først når profilen er koblet til en bruger.
              </p>
            )}
          </div>

          <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 lg:min-w-[220px]">
            <label htmlFor="plan-select" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Plan
            </label>
            <select
              id="plan-select"
              value={profile.plan as ProfilePlan}
              disabled={planSaving}
              onChange={(e) => void handlePlanChange(e.target.value as ProfilePlan)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-600"
            >
              <option value="basis">Basis</option>
              <option value="standard">Standard</option>
              <option value="plus">Plus</option>
            </select>
            {planSaving && <p className="mt-2 text-xs text-slate-500">Gemmer...</p>}
            {planError && <p className="mt-2 text-xs text-red-600">{planError}</p>}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Tickets</h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Ingen tickets for denne kunde.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tickets/${t.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-emerald-700 hover:underline">{t.title}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-500">{formatDanishDateTime(t.created_at)}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
