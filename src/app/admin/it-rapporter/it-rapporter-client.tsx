"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { IT_REPORTS_TABLE_COLUMNS } from "@/lib/it-reports";
import { logSupabaseError } from "@/lib/supabase-error";

type OrgEmbed = { name: string } | { name: string }[] | null;

type ItReportListRow = {
  id: string;
  organisation_id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  organisations: OrgEmbed;
};

function orgNameFromEmbed(embed: OrgEmbed): string {
  if (!embed) return "—";
  if (Array.isArray(embed)) return embed[0]?.name?.trim() || "—";
  return embed.name?.trim() || "—";
}

function statusLabel(s: string): string {
  if (s === "draft") return "Kladde";
  if (s === "approved") return "Godkendt";
  if (s === "sent") return "Sendt";
  return s;
}

function periodDa(start: string, end: string): string {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} – ${end}`;
  return `${a.toLocaleDateString("da-DK", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function AdminItRapporterClient() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ItReportListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("it_reports")
      .select(`${IT_REPORTS_TABLE_COLUMNS}, organisations(name)`)
      .order("created_at", { ascending: false });
    if (qErr) {
      logSupabaseError("[admin/it-rapporter] list", qErr);
      setError(qErr.message);
      setRows([]);
    } else {
      setRows((data ?? []) as ItReportListRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendReport = async (id: string) => {
    if (!window.confirm("Send rapport til alle brugere på organisationen via e-mail og marker som sendt?")) return;
    setSendBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/it-reports/${id}/send`, { method: "POST", credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Kunne ikke sende.");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netværksfejl.");
    } finally {
      setSendBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Organisationers IT-rapporter</h1>
      <p className="mt-2 text-sm text-slate-600">Rapporter genereret pr. kunde med AI og sendt til portalen.</p>

      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Henter…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">Ingen IT-rapporter endnu.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Oprettet</th>
                <th className="px-4 py-3 text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{orgNameFromEmbed(r.organisations)}</td>
                  <td className="px-4 py-3 text-slate-600">{periodDa(r.period_start, r.period_end)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.created_at).toLocaleString("da-DK", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/it-rapporter/${r.id}`}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Rediger
                      </Link>
                      {r.status !== "sent" ? (
                        <button
                          type="button"
                          disabled={sendBusyId === r.id}
                          onClick={() => void sendReport(r.id)}
                          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {sendBusyId === r.id ? "Sender…" : "Send"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
