"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type SystemRow = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  status: "ok" | "advarsel" | "nede";
  last_checked: string | null;
  company_name: string;
  email: string;
};

type Grouped = {
  company: string;
  email: string;
  systems: SystemRow[];
  counts: { ok: number; advarsel: number; nede: number };
};

export default function AdminSystemsClient() {
  useMemo(() => createClient(), []);
  const [rows, setRows] = useState<SystemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/systems", { credentials: "same-origin" });
      const payload = (await res.json().catch(() => ({}))) as { systems?: SystemRow[]; error?: string };
      if (cancelled) return;
      if (!res.ok || !payload.systems) {
        setError(payload.error ?? "Kunne ikke hente systemer.");
        setRows([]);
      } else {
        setRows(payload.systems);
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Grouped>();
    for (const row of rows) {
      const key = row.user_id;
      if (!map.has(key)) {
        map.set(key, {
          company: row.company_name,
          email: row.email,
          systems: [],
          counts: { ok: 0, advarsel: 0, nede: 0 },
        });
      }
      const g = map.get(key)!;
      g.systems.push(row);
      g.counts[row.status] += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.company.localeCompare(b.company, "da"));
  }, [rows]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Systemer</h1>
      <p className="mt-2 text-sm text-slate-600">Overblik over alle kunders systemer.</p>

      {loading ? <p className="mt-8 text-sm text-slate-500">Henter systemer...</p> : null}
      {error ? <p className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {!loading && !error && groups.length === 0 ? <p className="mt-8 text-sm text-slate-600">Ingen systemer endnu.</p> : null}

      {!loading && !error ? (
        <div className="mt-8 space-y-5">
          {groups.map((group) => {
            const hasDown = group.counts.nede > 0;
            return (
              <section
                key={`${group.company}-${group.email}`}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${hasDown ? "border-red-300" : "border-slate-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{group.company}</h2>
                    {group.email ? <p className="text-sm text-slate-600">{group.email}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-green-800">OK: {group.counts.ok}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">Advarsel: {group.counts.advarsel}</span>
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-red-800">Nede: {group.counts.nede}</span>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {group.systems.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.type}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.status === "ok"
                              ? "bg-green-100 text-green-800"
                              : s.status === "advarsel"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
