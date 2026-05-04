"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type ProfileEmbed = { company_name: string; email: string | null } | null;

type QuoteRow = {
  id: string;
  customer_profile_id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  profiles: ProfileEmbed;
};

function normalizeProfiles(raw: unknown): ProfileEmbed {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    const p = raw[0] as { company_name?: string; email?: string | null };
    if (!p) return null;
    return {
      company_name: String(p.company_name ?? ""),
      email: p.email != null ? String(p.email) : null,
    };
  }
  const p = raw as { company_name?: string; email?: string | null };
  return {
    company_name: String(p.company_name ?? ""),
    email: p.email != null ? String(p.email) : null,
  };
}

export default function AdminQuoteDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: qErr } = await supabase
      .from("quotes")
      .select("id, customer_profile_id, title, content, status, created_at, sent_at, profiles(company_name, email)")
      .eq("id", id)
      .maybeSingle();

    if (qErr || !data) {
      logSupabaseError("[admin/quotes/[id]] load", qErr);
      setQuote(null);
      setLoading(false);
      return;
    }

    const raw = data as Record<string, unknown>;
    const row: QuoteRow = {
      id: String(raw.id),
      customer_profile_id: String(raw.customer_profile_id),
      title: String(raw.title),
      content: String(raw.content ?? ""),
      status: String(raw.status),
      created_at: String(raw.created_at),
      sent_at: raw.sent_at != null ? String(raw.sent_at) : null,
      profiles: normalizeProfiles(raw.profiles),
    };
    setQuote(row);
    setTitle(row.title);
    setContent(row.content);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setSaving(true);
    setError(null);
    const { error: uErr } = await supabase
      .from("quotes")
      .update({
        title: title.trim(),
        content: content.trim(),
        status: quote.status === "sent" ? "sent" : "draft",
      })
      .eq("id", quote.id);

    setSaving(false);
    if (uErr) {
      logSupabaseError("[admin/quotes/[id]] save", uErr);
      setError(uErr.message);
      return;
    }
    void load();
  };

  const handleSend = async () => {
    if (!quote) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/admin/quotes/${quote.id}/send`, {
      method: "POST",
      credentials: "same-origin",
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke sende.");
      return;
    }
    void load();
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Indlæser tilbud...</p>;
  }

  if (!quote) {
    return (
      <div>
        <Link href="/admin/quotes" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til tilbud
        </Link>
        <p className="mt-6 text-sm text-slate-600">Tilbud ikke fundet.</p>
      </div>
    );
  }

  const company = quote.profiles?.company_name?.trim() ?? "—";
  const email = quote.profiles?.email?.trim();

  return (
    <div>
      <Link href="/admin/quotes" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Tilbage til tilbud
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Tilbud</h1>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{company}</span>
            {email ? (
              <>
                <span className="text-slate-400"> · </span>
                {email}
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-500">Oprettet {formatDanishDateTime(quote.created_at)}</p>
          {quote.status === "sent" && quote.sent_at ? (
            <p className="mt-1 text-xs text-emerald-700">Sendt {formatDanishDateTime(quote.sent_at)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {quote.status === "draft" ? (
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Kladde
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Sendt
            </span>
          )}
        </div>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="mt-8 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Indhold</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm leading-relaxed"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || sending}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#1D9E75" }}
          >
            {saving ? "Gemmer..." : "Gem ændringer"}
          </button>
          <button
            type="button"
            disabled={sending || saving}
            onClick={() => void handleSend()}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            {sending ? "Sender..." : quote.status === "sent" ? "Send igen til kunde" : "Send til kunde"}
          </button>
        </div>
      </form>
    </div>
  );
}
