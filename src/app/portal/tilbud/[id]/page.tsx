"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type QuoteDetail = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  sent_at: string | null;
};

export default function PortalTilbudDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setQuote(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setQuote(null);
      setLoading(false);
      return;
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pErr || !profile) {
      setQuote(null);
      setLoading(false);
      return;
    }

    const profileId = (profile as { id: string }).id;

    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, content, created_at, sent_at, customer_profile_id")
      .eq("id", id)
      .eq("status", "sent")
      .maybeSingle();

    if (error || !data) {
      if (error) logSupabaseError("[portal/tilbud/[id]]", error);
      setQuote(null);
      setLoading(false);
      return;
    }

    const row = data as {
      id: string;
      title: string;
      content: string;
      created_at: string;
      sent_at: string | null;
      customer_profile_id: string;
    };

    if (row.customer_profile_id !== profileId) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setQuote({
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      sent_at: row.sent_at,
    });
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PortalLayout activeNav="tilbud">
        <p className="text-sm text-slate-600">Indlæser tilbud...</p>
      </PortalLayout>
    );
  }

  if (!quote) {
    return (
      <PortalLayout activeNav="tilbud">
        <Link href="/portal/tilbud" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til tilbud
        </Link>
        <p className="mt-6 text-sm text-slate-600">Tilbud ikke fundet.</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout activeNav="tilbud">
      <Link href="/portal/tilbud" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Tilbage til tilbud
      </Link>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{quote.title}</h1>
        <p className="mt-2 text-xs text-slate-500">
          {quote.sent_at
            ? `Sendt ${formatDanishDateTime(quote.sent_at)}`
            : `Oprettet ${formatDanishDateTime(quote.created_at)}`}
        </p>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{quote.content}</div>
      </article>
    </PortalLayout>
  );
}
