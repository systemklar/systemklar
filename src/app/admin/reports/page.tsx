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

type TicketOption = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  user_id: string;
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
  const [customerTickets, setCustomerTickets] = useState<TicketOption[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [editingReport, setEditingReport] = useState<ReportAdminRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listActionError, setListActionError] = useState<string | null>(null);

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
    setEditingReport(null);
    setFormError(null);
    setCustomerUserId("");
    setTitle("");
    setPeriod("");
    setStatusSummary("");
    setIncidents("");
    setResolved("");
    setRecommendations("");
    setCustomerTickets([]);
    setTicketsLoading(false);
    setTicketsError(null);
    setAiGenerating(false);
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setFormError(null);
    setCustomerUserId("");
    setTitle("");
    setPeriod("");
    setStatusSummary("");
    setIncidents("");
    setResolved("");
    setRecommendations("");
    setCustomerTickets([]);
    setTicketsLoading(false);
    setTicketsError(null);
    setAiGenerating(false);
    setModalOpen(true);
  };

  const openEditModal = (r: ReportAdminRow) => {
    setEditingReport(r);
    setFormError(null);
    setCustomerUserId(r.user_id);
    setTitle(r.title);
    setPeriod(r.period);
    setStatusSummary(r.status_summary);
    setIncidents(r.incidents);
    setResolved(r.resolved);
    setRecommendations(r.recommendations);
    setCustomerTickets([]);
    setTicketsLoading(false);
    setTicketsError(null);
    setAiGenerating(false);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen || editingReport || !customerUserId) {
      setCustomerTickets([]);
      setTicketsError(null);
      setTicketsLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setTicketsLoading(true);
      setTicketsError(null);
      const res = await fetch("/api/admin/tickets", { credentials: "same-origin" });
      const payload = (await res.json().catch(() => ({}))) as {
        tickets?: TicketOption[];
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok || !payload.tickets) {
        setCustomerTickets([]);
        setTicketsError(payload.error ?? "Kunne ikke hente sager for kunden.");
      } else {
        setCustomerTickets((payload.tickets ?? []).filter((t) => t.user_id === customerUserId));
      }
      setTicketsLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, editingReport, customerUserId]);

  const activeTicketCount = useMemo(
    () => customerTickets.filter((t) => t.status === "active").length,
    [customerTickets],
  );
  const resolvedTicketCount = useMemo(
    () => customerTickets.filter((t) => t.status === "resolved").length,
    [customerTickets],
  );

  const handleGenerateWithAi = async () => {
    if (!customerUserId) {
      setFormError("Vælg en kunde først.");
      return;
    }
    setAiGenerating(true);
    setFormError(null);
    const res = await fetch("/api/admin/reports/generate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: customerUserId }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      sections?: {
        status_summary: string;
        incidents: string;
        resolved: string;
        recommendations: string;
      };
    };
    setAiGenerating(false);
    if (!res.ok || !payload.sections) {
      setFormError(payload.error ?? "AI-generering fejlede.");
      return;
    }
    setStatusSummary(payload.sections.status_summary);
    setIncidents(payload.sections.incidents);
    setResolved(payload.sections.resolved);
    setRecommendations(payload.sections.recommendations);
  };

  const handleDeleteReport = async (r: ReportAdminRow) => {
    const ok = window.confirm(`Er du sikker på at du vil slette rapporten "${r.title}"?`);
    if (!ok) return;

    setListActionError(null);
    setDeletingId(r.id);

    const res = await fetch(`/api/admin/reports/${r.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setDeletingId(null);

    if (!res.ok) {
      setListActionError(payload.error ?? "Sletning mislykkedes.");
      return;
    }

    void loadReports();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReport && !customerUserId) {
      setFormError("Vælg en kunde.");
      return;
    }
    if (!title.trim() || !period.trim()) {
      setFormError("Udfyld titel og periode.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    if (editingReport) {
      const res = await fetch(`/api/admin/reports/${editingReport.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          period: period.trim(),
          status_summary: statusSummary.trim(),
          incidents: incidents.trim(),
          resolved: resolved.trim(),
          recommendations: recommendations.trim(),
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setFormError(payload.error ?? "Kunne ikke gemme ændringer.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      closeModal();
      void loadReports();
      return;
    }

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
          onClick={openCreateModal}
          className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#1D9E75" }}
        >
          Opret rapport
        </button>
      </div>

      {listActionError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {listActionError}
        </p>
      )}

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
              <li
                key={r.id}
                className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50/80 md:flex-row md:items-start md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kunde</p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">{companyLabel}</p>
                  {cust?.email ? (
                    <p className="mt-0.5 text-sm text-slate-600">{cust.email}</p>
                  ) : null}
                  <Link
                    href={`/admin/reports/${r.id}`}
                    className="mt-2 inline-block font-semibold text-emerald-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-700">{r.period}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDanishDateTime(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-stretch">
                  <button
                    type="button"
                    onClick={() => openEditModal(r)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Rediger
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === r.id}
                    onClick={() => void handleDeleteReport(r)}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === r.id ? "Sletter..." : "Slet"}
                  </button>
                </div>
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
              {editingReport ? "Rediger rapport" : "Opret rapport"}
            </h2>

            <form className="mt-5 space-y-4" onSubmit={(ev) => void handleSubmit(ev)}>
              <div>
                <label htmlFor="rep-customer" className="mb-1 block text-sm font-medium text-slate-700">
                  Kunde
                </label>
                <select
                  id="rep-customer"
                  required={!editingReport}
                  disabled={!!editingReport}
                  value={customerUserId}
                  onChange={(e) => setCustomerUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Vælg kunde…</option>
                  {profiles.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.company_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
              {!editingReport && customerUserId ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {ticketsLoading ? (
                    <p>Henter kundens sager...</p>
                  ) : ticketsError ? (
                    <p className="text-red-700">{ticketsError}</p>
                  ) : (
                    <p>
                      {activeTicketCount} aktive sager, {resolvedTicketCount} løste sager
                    </p>
                  )}
                </div>
              ) : null}
              {!editingReport ? (
                <div>
                  <button
                    type="button"
                    disabled={!customerUserId || aiGenerating}
                    onClick={() => void handleGenerateWithAi()}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {aiGenerating ? "Genererer..." : "Generer rapport med AI"}
                  </button>
                </div>
              ) : null}
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
                  {submitting ? "Gemmer..." : editingReport ? "Gem ændringer" : "Gem rapport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
