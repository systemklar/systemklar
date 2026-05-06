"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CustomerStatusBadge } from "@/components/admin/CustomerStatusBadge";
import { PlanBadge, type ProfilePlan } from "@/components/admin/PlanBadge";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { createClient } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  email: string;
  company_name: string;
  plan: string;
  status: string;
  created_at: string;
  invited_at: string | null;
};

function InvitationBadge({ invitedAt }: { invitedAt: string | null }) {
  if (invitedAt) {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
        Inviteret
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      Ikke inviteret
    </span>
  );
}

export default function AdminCustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [plan, setPlan] = useState<ProfilePlan>("basis");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    okLines: string[];
    errLines: string[];
  } | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, company_name, plan, status, created_at, invited_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/customers] list", error);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as ProfileRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfiles();
    });
  }, [loadProfiles]);

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
    setEmail("");
    setCompanyName("");
    setPlan("basis");
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const co = companyName.trim();
    if (!em || !co) {
      setFormError("Udfyld e-mail og firmanavn.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setFormError("Session udløbet. Log ind igen.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/admin/invite-customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: em,
        company_name: co,
        plan,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setFormError(payload.error ?? "Kunne ikke oprette kunde.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    void loadProfiles();
  };

  const handleDeleteCustomer = async (p: ProfileRow) => {
    const ok = window.confirm(`Er du sikker på at du vil slette ${p.company_name}?`);
    if (!ok) return;

    setDeletingId(p.id);
    setDeleteError(null);

    const res = await fetch(`/api/admin/customers/${p.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };

    setDeletingId(null);

    if (!res.ok) {
      setDeleteError(payload.error ?? "Sletning mislykkedes.");
      return;
    }

    if (payload.warning) {
      console.warn("[admin/customers] customer deleted with warning:", payload.warning);
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(p.id);
      return next;
    });
    void loadProfiles();
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingProfileIds = useMemo(
    () => profiles.filter((p) => !p.invited_at).map((p) => p.id),
    [profiles]
  );

  const toggleSelectAll = () => {
    if (pendingProfileIds.length === 0) return;
    setSelectedIds((prev) => {
      const allSelected = pendingProfileIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of pendingProfileIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...pendingProfileIds]);
    });
  };

  const handleSendInvites = async () => {
    if (selectedIds.size === 0) return;

    setInviteBusy(true);
    setInviteFeedback(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setInviteFeedback({
        okLines: [],
        errLines: ["Du er ikke logget ind."],
      });
      setInviteBusy(false);
      return;
    }

    const res = await fetch("/api/admin/invite-customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ profile_ids: Array.from(selectedIds) }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      results?: {
        profile_id: string;
        email: string;
        ok: boolean;
        message?: string;
        error?: string;
      }[];
      error?: string;
    };

    setInviteBusy(false);

    if (!res.ok) {
      setInviteFeedback({
        okLines: [],
        errLines: [payload.error ?? "Invitationer kunne ikke sendes."],
      });
      return;
    }

    const results = payload.results ?? [];
    const okLines = results.filter((r) => r.ok && r.message).map((r) => r.message as string);
    const errLines = results
      .filter((r) => !r.ok)
      .map((r) => `${r.email || r.profile_id}: ${r.error ?? "Ukendt fejl"}`);

    setInviteFeedback({ okLines, errLines });
    setSelectedIds(new Set());
    void loadProfiles();
  };

  const allPendingSelected =
    pendingProfileIds.length > 0 && pendingProfileIds.every((id) => selectedIds.has(id));
  const hasSelection = selectedIds.size > 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Kunder</h1>
          <p className="mt-2 text-sm text-slate-600">Alle kundeprofiler.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {hasSelection && (
            <button
              type="button"
              disabled={inviteBusy}
              onClick={() => void handleSendInvites()}
              className="rounded-full border border-blue-600 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {inviteBusy ? "Sender invitationer..." : "Send invite"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ny kunde
          </button>
        </div>
      </div>

      {inviteFeedback && (inviteFeedback.okLines.length > 0 || inviteFeedback.errLines.length > 0) && (
        <div className="mt-4 space-y-3">
          {inviteFeedback.okLines.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <ul className="list-inside list-disc space-y-1">
                {inviteFeedback.okLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {inviteFeedback.errLines.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <ul className="list-inside list-disc space-y-1">
                {inviteFeedback.errLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {deleteError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter kunder...</p>
      ) : profiles.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">
          Ingen kunder endnu. Opret den første med &quot;Ny kunde&quot;.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleSelectAll}
                    disabled={pendingProfileIds.length === 0}
                    className="h-4 w-4 rounded border-slate-300"
                    title="Vælg alle uden invitation"
                    aria-label="Vælg alle uden invitation"
                  />
                </th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Invitation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Oprettet</th>
                <th className="px-4 py-3 text-right">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => {
                const canSelect = !p.invited_at;
                return (
                  <tr key={p.id} className="transition hover:bg-slate-50/80">
                    <td className="px-3 py-3 align-middle">
                      <input
                        type="checkbox"
                        disabled={!canSelect || inviteBusy}
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleRow(p.id)}
                        className="h-4 w-4 rounded border-slate-300 disabled:opacity-40"
                        aria-label={`Vælg ${p.company_name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${p.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {p.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{p.company_name}</td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={p.plan} />
                    </td>
                    <td className="px-4 py-3">
                      <InvitationBadge invitedAt={p.invited_at} />
                    </td>
                    <td className="px-4 py-3">
                      <CustomerStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDanishDateTime(p.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => void handleDeleteCustomer(p)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === p.id ? "Sletter..." : "Slet kunde"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-customer-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-customer-title" className="text-lg font-semibold text-slate-900">
              Ny kunde
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Opretter kun profilen — ingen e-mail. Brug &quot;Send invite&quot; for invitation.
            </p>

            <form className="mt-6 space-y-4" onSubmit={(ev) => void handleCreate(ev)}>
              <div>
                <label htmlFor="cust-email" className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="cust-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder="kunde@firma.dk"
                />
              </div>
              <div>
                <label htmlFor="cust-company" className="mb-1 block text-sm font-medium text-slate-700">
                  Firmanavn
                </label>
                <input
                  id="cust-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder="Firma A/S"
                />
              </div>
              <div>
                <label htmlFor="cust-plan" className="mb-1 block text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  id="cust-plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as ProfilePlan)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  <option value="basis">Basis</option>
                  <option value="standard">Standard</option>
                  <option value="plus">Plus</option>
                </select>
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
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Opretter..." : "Opret"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
