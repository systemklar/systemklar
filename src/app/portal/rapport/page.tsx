"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { REPORTS_TABLE_COLUMNS } from "@/lib/reports-queries";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type ReportListRow = {
  id: string;
  title: string;
  period: string;
  created_at: string;
};

export default function PortalRapportPage() {
  const supabase = useMemo(() => createClient(), []);
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
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <PortalLayout activeNav="rapport">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-[#0D1F2D]">IT-rapport</h1>
        <p className="mt-2 text-sm text-[#4A8CB5]">
          Dine månedlige rapporter over drift, hændelser og anbefalinger.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-[#4A8CB5]">Henter rapporter...</p>
        ) : reports.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-sky-100 bg-white px-5 py-8 text-center text-sm text-[#4A8CB5] shadow-sm">
            <span className="font-medium text-[#0D1F2D]">Ingen rapporter endnu</span>
            <span className="mt-2 block text-[#4A8CB5]">
              Din første rapport vil blive klar ved månedens afslutning, eller kontakt support hvis noget ser forkert ud.
            </span>
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/portal/rapport/${r.id}`}
                  className="block cursor-pointer rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <span className="inline-flex rounded-full bg-[#F0F7FF] px-3 py-1 text-xs font-medium text-sky-700">
                    {r.period}
                  </span>
                  <p className="mt-4 text-base font-semibold text-[#0D1F2D]">{r.title}</p>
                  <p className="mt-3 text-xs text-[#4A8CB5]">
                    Oppetid · Løste sager · Åbne sager · {formatDanishDateTime(r.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalLayout>
  );
}
