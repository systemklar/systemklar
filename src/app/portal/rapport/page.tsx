"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { REPORTS_TABLE_COLUMNS } from "@/lib/reports-queries";
import { logSupabaseError } from "@/lib/supabase-error";
import { supabase } from "@/lib/supabase";

type ReportListRow = {
  id: string;
  title: string;
  period: string;
  created_at: string;
};

export default function PortalRapportPage() {
  const [reports, setReports] = useState<ReportListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("reports")
      .select(REPORTS_TABLE_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("[portal/rapport] list", error);
      setReports([]);
    } else {
      const rows = (data ?? []).map((raw) => {
        const r = raw as Record<string, unknown>;
        return {
          id: String(r.id),
          title: String(r.title),
          period: String(r.period),
          created_at: String(r.created_at),
        } satisfies ReportListRow;
      });
      setReports(rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <PortalLayout activeNav="rapport">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">IT-rapport</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dine månedlige rapporter over drift, hændelser og anbefalinger.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-slate-500">Henter rapporter...</p>
        ) : reports.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600 shadow-sm">
            <span className="font-medium text-slate-800">Ingen rapporter endnu</span>
            <span className="mt-2 block text-slate-600">
              Din første rapport vil blive klar ved månedens afslutning, eller kontakt support hvis noget ser forkert ud.
            </span>
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/portal/rapport/${r.id}`}
                  className="block px-5 py-4 transition hover:bg-slate-50"
                >
                  <p className="font-semibold text-emerald-800 hover:underline">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{r.period}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDanishDateTime(r.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalLayout>
  );
}
