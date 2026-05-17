"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type QuoteDetail = {
  id: string;
  recipient_email: string | null;
  title: string;
  content: string;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export default function PortalTilbudDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setQuote(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("id, recipient_email, title, content, status, created_at, sent_at")
      .eq("id", id)
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
      recipient_email: string | null;
      status: string;
    };

    setQuote({
      id: row.id,
      recipient_email: row.recipient_email,
      title: row.title,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      sent_at: row.sent_at,
    });
    setTitle(row.title);
    setContent(row.content);
    setRecipientEmail(row.recipient_email ?? "");
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    const email = recipientEmail.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      setError("Angiv en gyldig modtager-email.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: uErr } = await supabase
      .from("quotes")
      .update({
        title: title.trim(),
        content: content.trim(),
        recipient_email: email,
        status: quote.status === "sent" ? "sent" : "draft",
      })
      .eq("id", quote.id);

    setSaving(false);
    if (uErr) {
      logSupabaseError("[portal/tilbud/[id]] save", uErr);
      setError(uErr.message);
      return;
    }
    void load();
  };

  const handleSend = async () => {
    if (!quote) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/portal/quotes/${quote.id}/send`, {
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
    return (
      <div className="w-full p-6 md:p-8">
        <p className="text-sm text-slate-600">Indlæser tilbud...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="w-full p-6 md:p-8">
        <Link href="/portal/tilbudsgenerator" className="text-sm font-semibold text-[#8B9E6B] hover:underline">
          ← Tilbage til AI Tilbudsgenerator
        </Link>
        <p className="mt-6 text-sm text-slate-600">Tilbud ikke fundet.</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-8">
      <Link href="/portal/tilbudsgenerator" className="text-sm font-semibold text-[#8B9E6B] hover:underline">
        ← Tilbage til AI Tilbudsgenerator
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Tilbud</h1>
          <p className="mt-2 text-xs text-slate-500">Oprettet {formatDanishDateTime(quote.created_at)}</p>
          {quote.status === "sent" && quote.sent_at ? (
            <p className="mt-1 text-xs text-green-700">Sendt {formatDanishDateTime(quote.sent_at)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {quote.status === "draft" ? (
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Kladde
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Sendt
            </span>
          )}
        </div>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="mt-8 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Modtager-email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="mt-2 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
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
            className="rounded-full bg-[#8B9E6B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7A8A5A] focus:outline-none focus:ring-2 focus:ring-[#8B9E6B] disabled:opacity-50"
          >
            {saving ? "Gemmer..." : "Gem ændringer"}
          </button>
          <button
            type="button"
            disabled={sending || saving}
            onClick={() => void handleSend()}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            {sending ? "Sender..." : quote.status === "sent" ? "Send igen" : "Send tilbud"}
          </button>
        </div>
      </form>
    </div>
  );
}
