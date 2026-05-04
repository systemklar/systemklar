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
  created_at: string;
  sent_at: string | null;
};

export default function PortalTilbudPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<QuoteListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setEmptyReason(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pErr || !profile) {
      if (pErr) logSupabaseError("[portal/tilbud] profile", pErr);
      setEmptyReason("Profil ikke fundet.");
      setRows([]);
      setLoading(false);
      return;
    }

    const profileId = (profile as { id: string }).id;

    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, created_at, sent_at")
      .eq("customer_profile_id", profileId)
      .eq("status", "sent")
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
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Tilbud</h1>
        <p className="mt-2 text-sm text-slate-600">Tilbud du har modtaget fra Systemklar.</p>

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Henter tilbud...</p>
        ) : emptyReason ? (
          <p className="mt-8 text-sm text-slate-600">{emptyReason}</p>
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
                  <p className="mt-1 text-xs text-slate-500">
                    Modtaget {q.sent_at ? formatDanishDateTime(q.sent_at) : formatDanishDateTime(q.created_at)}
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
