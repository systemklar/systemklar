"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import {
  buildItReportHtmlDocument,
  IT_REPORTS_TABLE_COLUMNS,
  parseItReportContent,
  periodLabelDa,
} from "@/lib/it-reports";
import { createClient } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-error";

type OrgEmbed = { name: string } | { name: string }[] | null;

type ItReportRow = {
  id: string;
  organisation_id: string;
  title: string;
  period_start: string;
  period_end: string;
  content: unknown;
  ai_summary: string | null;
  ai_recommendations: string | null;
  status: string;
  created_at: string;
  organisations: OrgEmbed;
};

function orgNameFromEmbed(embed: OrgEmbed): string {
  if (!embed) return "Organisation";
  if (Array.isArray(embed)) return embed[0]?.name?.trim() || "Organisation";
  return embed.name?.trim() || "Organisation";
}

function statusBadge(s: string): { label: string; className: string } {
  if (s === "sent") return { label: "Sendt", className: "bg-emerald-100 text-emerald-900" };
  if (s === "approved") return { label: "Godkendt", className: "bg-sky-100 text-sky-900" };
  return { label: "Kladde", className: "bg-amber-100 text-amber-900" };
}

export default function ItReportDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const supabase = useMemo(() => createClient(), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ItReportRow | null>(null);
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("it_reports")
      .select(`${IT_REPORTS_TABLE_COLUMNS}, organisations(name)`)
      .eq("id", id)
      .maybeSingle();
    if (qErr) {
      logSupabaseError("[admin/it-rapporter/[id]]", qErr);
      setError(qErr.message);
      setRow(null);
      setLoading(false);
      return;
    }
    if (!data) {
      setError("Rapport ikke fundet.");
      setRow(null);
      setLoading(false);
      return;
    }
    const r = data as ItReportRow;
    setRow(r);
    setSummary(r.ai_summary ?? "");
    setRecommendations(r.ai_recommendations ?? "");
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const content = useMemo(() => parseItReportContent(row?.content), [row?.content]);

  const previewHtml = useMemo(() => {
    if (!row || !content) return "";
    const periodLabel = periodLabelDa(row.period_start, row.period_end);
    const assetBaseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    return buildItReportHtmlDocument({
      organisationName: content.organisationName,
      periodLabel,
      aiSummary: summary,
      aiRecommendations: recommendations,
      content,
      forPrint: false,
      assetBaseUrl: assetBaseUrl || undefined,
    });
  }, [row, content, summary, recommendations]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !previewHtml) return;
    el.srcdoc = previewHtml;
  }, [previewHtml]);

  const save = async () => {
    if (!id || !row || row.status === "sent") return;
    setSaving(true);
    setError(null);
    const { error: uErr } = await supabase
      .from("it_reports")
      .update({ ai_summary: summary, ai_recommendations: recommendations })
      .eq("id", id);
    setSaving(false);
    if (uErr) {
      logSupabaseError("[admin/it-rapporter] save", uErr);
      setError(uErr.message);
      return;
    }
    await load();
  };

  const sendToCustomer = async () => {
    if (!id || row?.status === "sent") return;
    if (!window.confirm("Godkend og send rapporten til alle brugere på organisationen?")) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/it-reports/${id}/send`, { method: "POST", credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Kunne ikke sende.");
        setSending(false);
        return;
      }
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netværksfejl.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-12 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Indlæser rapport…
      </div>
    );
  }

  if (!row || !content) {
    return (
      <div className="px-4 py-8">
        <p className="text-red-600">{error ?? "Rapporten kunne ikke indlæses."}</p>
        <Link href="/admin/it-rapporter" className="mt-4 inline-block text-sm font-semibold text-sky-700">
          ← Tilbage
        </Link>
      </div>
    );
  }

  const badge = statusBadge(row.status);
  const orgTitle = orgNameFromEmbed(row.organisations);
  const periodLabel = periodLabelDa(row.period_start, row.period_end);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/it-rapporter" className="text-sm font-semibold text-sky-700 hover:underline">
            ← Tilbage til IT-rapporter
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            IT-rapport — {orgTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{periodLabel}</p>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/portal/reports/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Download rapport (HTML)
          </a>
          {row.status !== "sent" ? (
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendToCustomer()}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {sending ? "Sender…" : "Godkend & send til kunde"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Redigering</h2>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Sammenfatning</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={row.status === "sent"}
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Anbefalinger</span>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              disabled={row.status === "sent"}
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
              placeholder="- Første anbefaling&#10;- Anden anbefaling"
            />
          </label>
          {row.status !== "sent" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Gemmer…" : "Gem ændringer"}
            </button>
          ) : (
            <p className="text-sm text-slate-500">Rapporten er sendt og kan ikke længere redigeres.</p>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Forhåndsvisning</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
            <iframe
              ref={iframeRef}
              title="Rapport forhåndsvisning"
              className="h-[920px] w-full bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
