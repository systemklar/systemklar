"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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

type OrganisationOption = {
  id: string;
  name: string;
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
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ItReportListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [orgOptions, setOrgOptions] = useState<OrganisationOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

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

  const groupedReports = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const map = new Map<string, ItReportListRow[]>();
    for (const r of sorted) {
      const key = r.organisation_id || orgNameFromEmbed(r.organisations);
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([key, reports]) => ({
        key,
        name: orgNameFromEmbed(reports[0]?.organisations ?? null),
        reports,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "da"));
  }, [rows]);

  const multiOrg = groupedReports.length > 1;

  const confirmDeleteReport = async (id: string) => {
    setDeleteBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/it-rapporter/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Kunne ikke slette.");
        return;
      }
      setDeleteConfirmId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netværksfejl.");
    } finally {
      setDeleteBusyId(null);
    }
  };

  const loadOrganisationOptions = useCallback(async () => {
    setOrgsLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/organisations", {
        credentials: "include",
        redirect: "manual",
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setOrgOptions([]);
        setGenError("Uventet svar fra serveren.");
        return;
      }
      const payload = (await res.json()) as { error?: string; organisations?: unknown };
      if (!res.ok) {
        setOrgOptions([]);
        setGenError(payload.error ?? "Kunne ikke hente organisationer.");
        return;
      }
      const raw = (payload.organisations ?? []) as { id?: string; name?: string }[];
      const opts: OrganisationOption[] = raw
        .filter((o): o is OrganisationOption => typeof o.id === "string" && typeof o.name === "string")
        .map((o) => ({ id: o.id, name: o.name.trim() || "Uden navn" }))
        .sort((a, b) => a.name.localeCompare(b.name, "da"));
      setOrgOptions(opts);
    } catch {
      setOrgOptions([]);
      setGenError("Netværksfejl. Prøv igen.");
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  const openNewModal = () => {
    setSelectedOrgId("");
    setGenError(null);
    setNewModalOpen(true);
    void loadOrganisationOptions();
  };

  const closeNewModal = () => {
    setNewModalOpen(false);
    setGenError(null);
    setGenBusy(false);
  };

  const handleGenerateNew = async () => {
    if (!selectedOrgId) {
      setGenError("Vælg en organisation.");
      return;
    }
    setGenBusy(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organisationId: selectedOrgId }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setGenError(payload.error ?? "Kunne ikke generere rapport.");
        return;
      }
      const dest =
        typeof payload.redirect === "string"
          ? payload.redirect
          : payload.id
            ? `/admin/it-rapporter/${payload.id}`
            : null;
      if (!dest) {
        setGenError("Manglede redirect fra serveren.");
        return;
      }
      closeNewModal();
      router.push(dest);
    } catch {
      setGenError("Netværksfejl. Prøv igen.");
    } finally {
      setGenBusy(false);
    }
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organisationers IT-rapporter</h1>
          <p className="mt-2 text-sm text-slate-600">Rapporter genereret pr. kunde med AI og sendt til portalen.</p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:self-center"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ny rapport
        </button>
      </div>

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
                {multiOrg ? null : <th className="px-4 py-3">Organisation</th>}
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Oprettet</th>
                <th className="px-4 py-3 text-right">Handlinger</th>
              </tr>
            </thead>
            {multiOrg
              ? groupedReports.map((g) => (
                  <tbody key={g.key}>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <td colSpan={4} className="px-4 py-2.5 text-sm font-bold text-slate-900">
                        {g.name}
                      </td>
                    </tr>
                    {g.reports.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
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
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {deleteConfirmId === r.id ? (
                              <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                                <span className="font-medium text-slate-700">Er du sikker?</span>
                                <button
                                  type="button"
                                  disabled={deleteBusyId === r.id}
                                  onClick={() => void confirmDeleteReport(r.id)}
                                  className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deleteBusyId === r.id ? "Sletter…" : "Ja"}
                                </button>
                                <button
                                  type="button"
                                  disabled={deleteBusyId === r.id}
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Annuller
                                </button>
                              </div>
                            ) : (
                              <>
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
                                <button
                                  type="button"
                                  disabled={deleteBusyId === r.id || sendBusyId === r.id}
                                  onClick={() => setDeleteConfirmId(r.id)}
                                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Slet
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))
              : (
                  <tbody>
                    {groupedReports.flatMap((g) => g.reports).map((r) => (
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
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {deleteConfirmId === r.id ? (
                            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                              <span className="font-medium text-slate-700">Er du sikker?</span>
                              <button
                                type="button"
                                disabled={deleteBusyId === r.id}
                                onClick={() => void confirmDeleteReport(r.id)}
                                className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deleteBusyId === r.id ? "Sletter…" : "Ja"}
                              </button>
                              <button
                                type="button"
                                disabled={deleteBusyId === r.id}
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Annuller
                              </button>
                            </div>
                          ) : (
                            <>
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
                              <button
                                type="button"
                                disabled={deleteBusyId === r.id || sendBusyId === r.id}
                                onClick={() => setDeleteConfirmId(r.id)}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                              >
                                Slet
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                )}
          </table>
        </div>
      )}

      {newModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-it-report-title"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget && !genBusy) closeNewModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="new-it-report-title" className="text-lg font-semibold text-slate-900">
              Ny IT-rapport
            </h2>
            <p className="mt-1 text-sm text-slate-600">Vælg organisation og generér en kladde med data fra de seneste 30 dage.</p>

            <div className="mt-5">
              <label htmlFor="new-report-org" className="mb-1 block text-sm font-medium text-slate-700">
                Organisation
              </label>
              <select
                id="new-report-org"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                disabled={orgsLoading || genBusy}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{orgsLoading ? "Henter organisationer…" : "Vælg organisation…"}</option>
                {orgOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {genError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{genError}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={genBusy}
                onClick={closeNewModal}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuller
              </button>
              <button
                type="button"
                disabled={genBusy || orgsLoading || !selectedOrgId}
                onClick={() => void handleGenerateNew()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {genBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Genererer…
                  </>
                ) : (
                  "Generér"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
