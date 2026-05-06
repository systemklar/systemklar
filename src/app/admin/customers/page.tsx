"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { createClient } from "@/lib/supabase";

type AcceptedCustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  avatar_initials: string | null;
  organisation_id: string | null;
  created_at: string;
  organisations: { name: string } | { name: string }[] | null;
};

type PendingInvitationRow = {
  id: string;
  email: string;
  role: string;
  contact_name: string | null;
  created_at: string;
  expires_at: string;
  organisations: { name: string } | { name: string }[] | null;
};

function orgNameOf(row: { organisations: { name: string } | { name: string }[] | null }) {
  return Array.isArray(row.organisations)
    ? row.organisations[0]?.name ?? "Ukendt organisation"
    : row.organisations?.name ?? "Ukendt organisation";
}

export default function AdminCustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<AcceptedCustomerRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<"org_admin" | "member">("org_admin");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [customersRes, invitesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, avatar_initials, organisation_id, created_at, organisations(name)")
        .not("organisation_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("invitations")
        .select("id, email, role, contact_name, created_at, expires_at, organisations(name)")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);

    if (customersRes.error) {
      console.error("[admin/customers] customers list", customersRes.error);
      setCustomers([]);
    } else {
      setCustomers((customersRes.data ?? []) as AcceptedCustomerRow[]);
    }

    if (invitesRes.error) {
      console.error("[admin/customers] pending invites list", invitesRes.error);
      setPendingInvites([]);
    } else {
      setPendingInvites((invitesRes.data ?? []) as PendingInvitationRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
    setEmail("");
    setContactName("");
    setCompanyName("");
    setRole("org_admin");
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const contact = contactName.trim();
    const co = companyName.trim();
    if (!em || !contact || !co) {
      setFormError("Udfyld fuldt navn, email og virksomhedsnavn.");
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
        contact_name: contact,
        company_name: co,
        role,
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
    void loadData();
  };

  const handleDeleteCustomer = async (p: AcceptedCustomerRow) => {
    const targetName = p.full_name?.trim() || p.email || "kunden";
    const ok = window.confirm(`Er du sikker på at du vil slette ${targetName}?`);
    if (!ok) return;

    setDeletingId(p.id);
    setActionError(null);

    const res = await fetch(`/api/admin/customers/${p.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };
    setDeletingId(null);

    if (!res.ok) {
      setActionError(payload.error ?? "Sletning mislykkedes.");
      return;
    }
    if (payload.warning) {
      console.warn("[admin/customers] customer deleted with warning:", payload.warning);
    }
    void loadData();
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionError(null);
    const res = await fetch(`/api/admin/invitations/${invitationId}`, {
      method: "POST",
      credentials: "same-origin",
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setActionError(payload.error ?? "Kunne ikke gensende invitation.");
      return;
    }
    void loadData();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const ok = window.confirm("Annuller denne invitation?");
    if (!ok) return;
    setActionError(null);
    const res = await fetch(`/api/admin/invitations/${invitationId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setActionError(payload.error ?? "Kunne ikke annullere invitation.");
      return;
    }
    void loadData();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Kunder</h1>
          <p className="mt-2 text-sm text-slate-600">Kunder og invitationer på tværs af organisationer.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ny kunde
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter kunder...</p>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Kunder</h2>
            {customers.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Ingen accepterede kunder endnu.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {customers.map((c) => {
                  const initials =
                    c.avatar_initials ||
                    (c.full_name ?? "")
                      .split(/\s+/)
                      .map((n) => n[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ||
                    "??";
                  return (
                    <article key={c.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-700">
                            {initials}
                          </div>
                          <div>
                            <p className="text-base font-semibold text-[#0D1F2D]">
                              {c.full_name || c.email || "Ukendt bruger"}
                            </p>
                            <p className="text-sm text-[#4A8CB5]">{orgNameOf(c)}</p>
                            <p className="text-sm text-[#4A8CB5]">{c.email || "—"}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            c.role === "org_admin" ? "bg-sky-100 text-sky-700" : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {c.role === "org_admin" ? "Administrator" : "Medlem"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">Oprettet {formatDanishDateTime(c.created_at)}</p>
                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => void handleDeleteCustomer(c)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === c.id ? "Sletter..." : "Slet kunde"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Afventer invitation</h2>
            {pendingInvites.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Ingen afventende invitationer.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {pendingInvites.map((inv) => (
                  <article key={inv.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#0D1F2D]">
                          {inv.contact_name?.trim() || inv.email}
                        </p>
                        <p className="text-sm text-[#4A8CB5]">{orgNameOf(inv)}</p>
                        <p className="text-sm text-[#4A8CB5]">{inv.email}</p>
                        <p className="mt-2 text-xs text-slate-500">Inviteret {formatDanishDateTime(inv.created_at)}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Afventer
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleResendInvitation(inv.id)}
                        className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        Gensend invitation
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancelInvitation(inv.id)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Annuller
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
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
            <p className="mt-1 text-sm text-slate-500">Opret organisation og send invitation til kontaktpersonen.</p>

            <form className="mt-6 space-y-4" onSubmit={(ev) => void handleCreate(ev)}>
              <div>
                <label htmlFor="cust-contact-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Kontaktpersonens fulde navn
                </label>
                <input
                  id="cust-contact-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder="Fx Mette Jensen"
                />
              </div>
              <div>
                <label htmlFor="cust-company" className="mb-1 block text-sm font-medium text-slate-700">
                  Virksomhedsnavn
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
                <label htmlFor="cust-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
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
                <label htmlFor="cust-role" className="mb-1 block text-sm font-medium text-slate-700">
                  Rolle
                </label>
                <select
                  id="cust-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value === "member" ? "member" : "org_admin")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  <option value="org_admin">Administrator</option>
                  <option value="member">Medlem</option>
                </select>
              </div>

              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

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
