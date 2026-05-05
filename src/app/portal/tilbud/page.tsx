"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type QuoteListRow = {
  id: string;
  title: string;
  recipient_email: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export default function PortalTilbudPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<QuoteListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, recipient_email, status, created_at, sent_at")
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("[portal/tilbud] quotes", error);
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
    <PortalLayout activeNav="tilbud">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Tilbud</h1>
            <p className="mt-2 text-sm text-slate-600">Oversigt over dine egne tilbud.</p>
          </div>
          <Link
            href="/portal/tilbud/new"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#1D9E75" }}
          >
            Nyt tilbud
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Henter tilbud...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-sm text-slate-600">Du har ingen tilbud endnu.</p>
        ) : (
          <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {rows.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/portal/tilbud/${q.id}`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-900">{q.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{q.recipient_email || "Ingen modtager sat"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Oprettet {formatDanishDateTime(q.created_at)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {q.status === "sent" && q.sent_at
                      ? `Sendt ${formatDanishDateTime(q.sent_at)}`
                      : "Kladde"}
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
