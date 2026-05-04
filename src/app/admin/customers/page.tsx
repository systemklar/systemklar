"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { CustomerStatusBadge } from "@/components/admin/CustomerStatusBadge";
import { PlanBadge, type ProfilePlan } from "@/components/admin/PlanBadge";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  email: string;
  company_name: string;
  plan: string;
  status: string;
  created_at: string;
};

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [plan, setPlan] = useState<ProfilePlan>("basis");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompanyName, setInviteCompanyName] = useState("");
  const [invitePlan, setInvitePlan] = useState<ProfilePlan>("basis");
  const [submitting, setSubmitting] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteFormError, setInviteFormError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, company_name, plan, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/customers] list", error);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as ProfileRow[]);
    }
    setLoading(false);
  }, []);

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

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteFormError(null);
    setInviteEmail("");
    setInviteCompanyName("");
    setInvitePlan("basis");
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const em = inviteEmail.trim().toLowerCase();
    const co = inviteCompanyName.trim();
    if (!em || !co) {
      setInviteFormError("Udfyld e-mail og virksomhedsnavn.");
      return;
    }

    setInviteSubmitting(true);
    setInviteFormError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setInviteFormError("Du er ikke logget ind.");
      setInviteSubmitting(false);
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
        plan: invitePlan,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      welcomeEmailSent?: boolean;
    };

    if (!res.ok) {
      setInviteFormError(payload.error ?? "Invitationen kunne ikke sendes.");
      setInviteSubmitting(false);
      return;
    }

    setInviteSubmitting(false);
    closeInviteModal();
    void loadProfiles();

    if (payload.welcomeEmailSent === false) {
      console.warn("[admin/customers] Velkomstmail blev ikke sendt (tjek Resend).");
    }
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

    const { error } = await supabase.from("profiles").insert({
      email: em,
      company_name: co,
      plan,
      status: "active",
    });

    if (error) {
      console.error("[admin/customers] insert", error);
      setFormError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    void loadProfiles();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Kunder</h1>
          <p className="mt-2 text-sm text-slate-600">Alle kundeprofiler.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="rounded-full border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Inviter kunde
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#1D9E75" }}
          >
            Opret kunde
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter kunder...</p>
      ) : profiles.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">Ingen kunder endnu. Opret den første med knappen ovenfor.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Oprettet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${p.id}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {p.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{p.company_name}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={p.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <CustomerStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDanishDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-customer-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeInviteModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="invite-customer-title" className="text-lg font-semibold text-slate-900">
              Inviter kunde
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kunden får e-mail med link til at vælge adgangskode og lander derefter i portalen.
            </p>

            <form className="mt-6 space-y-4" onSubmit={(ev) => void handleInvite(ev)}>
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  placeholder="kunde@firma.dk"
                />
              </div>
              <div>
                <label
                  htmlFor="invite-company"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Virksomhedsnavn
                </label>
                <input
                  id="invite-company"
                  type="text"
                  required
                  value={inviteCompanyName}
                  onChange={(e) => setInviteCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  placeholder="Firma A/S"
                />
              </div>
              <div>
                <label htmlFor="invite-plan" className="mb-1 block text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  id="invite-plan"
                  value={invitePlan}
                  onChange={(e) => setInvitePlan(e.target.value as ProfilePlan)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="basis">Basis</option>
                  <option value="standard">Standard</option>
                  <option value="plus">Plus</option>
                </select>
              </div>

              {inviteFormError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteFormError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {inviteSubmitting ? "Sender invitation..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
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
              Opret kunde
            </h2>
            <p className="mt-1 text-sm text-slate-500">Tilføj en ny profil i databasen.</p>

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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
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
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
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
