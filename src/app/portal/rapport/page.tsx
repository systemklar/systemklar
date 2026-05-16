"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-error";

type ItReportListRow = {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: string;
};

function periodLabel(start: string, end: string): string {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} – ${end}`;
  return `${a.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })} – ${b.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}`;
}

export default function PortalRapportPage() {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<ItReportListRow[]>([]);
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

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("organisation_id")
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (pErr) {
      logSupabaseError("[portal/rapport] profile", pErr);
      setReports([]);
      setLoading(false);
      return;
    }

    const orgId = profile?.organisation_id as string | null | undefined;
    if (!orgId) {
      setReports([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("it_reports")
      .select("id, title, period_start, period_end, status")
      .eq("organisation_id", orgId)
      .eq("status", "sent")
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("[portal/rapport] it_reports", error);
      setReports([]);
    } else {
      setReports((data ?? []) as ItReportListRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0D1F2D]">IT-rapport</h1>
      <p className="mt-2 text-sm text-[#4A8CB5]">
        Dine månedlige IT-statusrapporter — åbn og læs dem her i portalen.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-[#4A8CB5]">Henter rapporter...</p>
      ) : reports.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-sky-100 bg-white px-5 py-8 text-center text-sm text-[#4A8CB5] shadow-sm">
          <span className="font-medium text-[#0D1F2D]">Ingen rapporter endnu.</span>
          <span className="mt-2 block">
            Din første rapport genereres af Systemklar hver måned.
          </span>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-[#0D1F2D]">{r.title}</p>
                <p className="mt-1 text-sm text-[#4A8CB5]">{periodLabel(r.period_start, r.period_end)}</p>
              </div>
              <Link
                href={`/portal/rapport/${r.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0]"
              >
                Se rapport
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
