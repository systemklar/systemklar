"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type ProfileEmbed = { company_name: string } | { company_name: string }[] | null;

type QuoteListRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  profiles: ProfileEmbed;
};

function companyNameFromRow(q: QuoteListRow): string {
  const p = q.profiles;
  if (!p) return "—";
  if (Array.isArray(p)) {
    return p[0]?.company_name?.trim() || "—";
  }
  return p.company_name?.trim() || "—";
}

export default function AdminQuotesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<QuoteListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, status, created_at, sent_at, profiles(company_name)")
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("[admin/quotes] list", error);
      setRows([]);
    } else {
      setRows((data ?? []) as QuoteListRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Tilbud</h1>
          <p className="mt-2 text-sm text-slate-600">Oversigt over genererede tilbud.</p>
        </div>
        <Link
          href="/admin/quotes/new"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#1D9E75" }}
        >
          Nyt tilbud
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Henter tilbud...</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ingen tilbud endnu.</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {rows.map((q) => (
            <li key={q.id}>
              <Link
                href={`/admin/quotes/${q.id}`}
                className="flex flex-col gap-1 px-5 py-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{q.title}</p>
                  <p className="text-sm text-slate-600">{companyNameFromRow(q)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDanishDateTime(q.created_at)}</p>
                </div>
                <div className="shrink-0">
                  {q.status === "sent" ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Sendt
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      Kladde
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
