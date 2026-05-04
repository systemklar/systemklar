"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { companyNameFromProfilesEmbed, REPORTS_ADMIN_SELECT_WITH_PROFILE, REPORTS_TABLE_COLUMNS } from "@/lib/reports-queries";
import { formatSupabaseError, logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type ProfileOption = {
  user_id: string;
  company_name: string;
  email: string;
};

type ReportAdminRow = {
  id: string;
  user_id: string;
  title: string;
  period: string;
  status_summary: string;
  incidents: string;
  resolved: string;
  recommendations: string;
  created_at: string;
  /** From PostgREST embed when available; otherwise filled from `profiles` cache in UI. */
  company_name: string | null;
};

export default function AdminReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<ReportAdminRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [customerUserId, setCustomerUserId] = useState("");
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [statusSummary, setStatusSummary] = useState("");
  const [incidents, setIncidents] = useState("");
  const [resolved, setResolved] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setListError(null);

    const embedded = await supabase
      .from("reports")
      .select(REPORTS_ADMIN_SELECT_WITH_PROFILE)
      .order("created_at", { ascending: false });

    let payload: unknown[] | null = null;
    let embedCompany = false;

    if (!embedded.error) {
      payload = embedded.data ?? [];
      embedCompany = true;
    } else {
      logSupabaseError("[admin/reports] list (profiles join)", embedded.error);
      const plain = await supabase.from("reports").select(REPORTS_TABLE_COLUMNS).order("created_at", { ascending: false });
      if (plain.error) {
        logSupabaseError("[admin/reports] list", plain.error);
        const { message, code, details, hint, status } = formatSupabaseError(plain.error);
        setListError(
          [
            message && `Message: ${message}`,
            code && `Code: ${code}`,
            status && `Status: ${status}`,
            details && `Details: ${details}`,
            hint && `Hint: ${hint}`,
          ]
            .filter(Boolean)
            .join(" · ") || "Ukendt fejl ved hentning af rapporter.",
        );
        setReports([]);
        setLoading(false);
        return;
      }
      payload = plain.data ?? [];
    }

    const rows = (payload ?? []).map((raw) => {
      const r = raw as Record<string, unknown>;
      const company_name = embedCompany ? companyNameFromProfilesEmbed(r.profiles) : null;
      return {
        id: String(r.id),
        user_id: String(r.user_id),
        title: String(r.title),
        period: String(r.period),
        status_summary: String(r.status_summary ?? ""),
        incidents: String(r.incidents ?? ""),
        resolved: String(r.resolved ?? ""),
        recommendations: String(r.recommendations ?? ""),
        created_at: String(r.created_at),
        company_name,
      } satisfies ReportAdminRow;
    });
    setReports(rows);
    setLoading(false);
  }, [supabase]);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, company_name, email")
      .not("user_id", "is", null)
      .order("company_name", { ascending: true });

    if (error) {
      logSupabaseError("[admin/reports] profiles", error);
      setProfiles([]);
      return;
    }
    setProfiles(
      (data ?? []).filter((p): p is ProfileOption => typeof (p as ProfileOption).user_id === "string"),
    );
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadReports();
      void loadProfiles();
    });
  }, [loadReports, loadProfiles]);

  const profileByUserId = useMemo(() => {
    const m = new Map<string, ProfileOption>();
    for (const p of profiles) {
      m.set(p.user_id, p);
    }
    return m;
  }, [profiles]);

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
    setCustomerUserId("");
    setTitle("");
    setPeriod("");
    setStatusSummary("");
    setIncidents("");
    setResolved("");
    setRecommendations("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerUserId) {
      setFormError("Vælg en kunde.");
      return;
    }
    if (!title.trim() || !period.trim()) {
      setFormError("Udfyld titel og periode.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const { error } = await supabase.from("reports").insert({
      user_id: customerUserId,
      title: title.trim(),
      period: period.trim(),
      status_summary: statusSummary.trim(),
      incidents: incidents.trim(),
      resolved: resolved.trim(),
      recommendations: recommendations.trim(),
    });

    if (error) {
      logSupabaseError("[admin/reports] insert", error);
      const formatted = formatSupabaseError(error);
      setFormError(
        [formatted.message, formatted.code && `(${formatted.code})`, formatted.details && `— ${formatted.details}`]
          .filter(Boolean)
          .join(" "),
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    void loadReports();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">IT-rapporter</h1>
          <p className="mt-2 text-sm text-slate-600">Alle kunders rapporter.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#1D9E75" }}
        >
          Opret rapport
        </button>
      </div>

      {listError && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{listError}</p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter rapporter...</p>
      ) : reports.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">Ingen rapporter endnu.</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {reports.map((r) => {
            const cust = profileByUserId.get(r.user_id);
            const companyLabel = r.company_name?.trim() || cust?.company_name?.trim() || "—";
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="block px-5 py-4 transition hover:bg-slate-50"
                >
                  <p className="font-semibold text-emerald-900 hover:underline">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{r.period}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {companyLabel}
                    {cust?.email ? ` · ${cust.email}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatDanishDateTime(r.created_at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) closeModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="report-modal-title" className="text-lg font-semibold text-slate-900">
              Opret rapport
            </h2>

            <form className="mt-5 space-y-4" onSubmit={(ev) => void handleSubmit(ev)}>
              <div>
                <label htmlFor="rep-customer" className="mb-1 block text-sm font-medium text-slate-700">
                  Kunde
                </label>
                <select
                  id="rep-customer"
                  required
                  value={customerUserId}
                  onChange={(e) => setCustomerUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="">Vælg kunde…</option>
                  {profiles.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.company_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rep-title" className="mb-1 block text-sm font-medium text-slate-700">
                  Titel
                </label>
                <input
                  id="rep-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  placeholder="IT-rapport — Maj 2026"
                />
              </div>
              <div>
                <label htmlFor="rep-period" className="mb-1 block text-sm font-medium text-slate-700">
                  Periode
                </label>
                <input
                  id="rep-period"
                  type="text"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  placeholder="Maj 2026"
                />
              </div>
              <div>
                <label htmlFor="rep-status-summary" className="mb-1 block text-sm font-medium text-slate-700">
                  Statusoversigt
                </label>
                <textarea
                  id="rep-status-summary"
                  rows={4}
                  value={statusSummary}
                  onChange={(e) => setStatusSummary(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="rep-inc" className="mb-1 block text-sm font-medium text-slate-700">
                  Hændelser
                </label>
                <textarea
                  id="rep-inc"
                  rows={4}
                  value={incidents}
                  onChange={(e) => setIncidents(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="rep-res" className="mb-1 block text-sm font-medium text-slate-700">
                  Løste sager
                </label>
                <textarea
                  id="rep-res"
                  rows={4}
                  value={resolved}
                  onChange={(e) => setResolved(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="rep-rec" className="mb-1 block text-sm font-medium text-slate-700">
                  Anbefalinger
                </label>
                <textarea
                  id="rep-rec"
                  rows={4}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {submitting ? "Gemmer..." : "Gem rapport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
