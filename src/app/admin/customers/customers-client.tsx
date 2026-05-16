"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Modal } from "@/components/ui/Modal";
import { isLikelyOrganisationDomain, normalizeOrganisationDomainInput } from "@/lib/organisation-domain";
import { createClient } from "@/lib/supabase";
import { withCacheBust } from "@/lib/storage-public-urls";

type OrgProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_initials: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type OrgInvitation = {
  id: string;
  email: string | null;
  contact_name: string | null;
  accepted_at: string | null;
  created_at: string | null;
};

type OrganisationRow = {
  id: string;
  name: string;
  created_at: string;
  logo_url: string | null;
  profiles: OrgProfile[] | null;
  invitations: OrgInvitation[] | null;
};

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminCustomersClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<OrganisationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [role, setRole] = useState<"org_admin" | "member">("org_admin");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mediaVersion, setMediaVersion] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organisations", {
        credentials: "include",
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        console.warn("[admin/customers] organisations list redirect", res.status);
        setOrgs([]);
        setActionError("Session udløbet eller ikke logget ind. Genindlæs siden.");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[admin/customers] organisations non-JSON", res.status, text.slice(0, 300));
        setOrgs([]);
        setActionError("Uventet svar fra serveren.");
        return;
      }

      const payload = (await res.json()) as { error?: string; organisations?: unknown };

      if (!res.ok) {
        console.error("[admin/customers] organisations list HTTP", res.status, payload.error);
        setOrgs([]);
        setActionError(payload.error ?? "Kunne ikke hente organisationer.");
        return;
      }

      setOrgs((payload.organisations ?? []) as OrganisationRow[]);
      setMediaVersion(Date.now());
      setActionError(null);
    } catch (e) {
      console.error("[admin/customers] organisations fetch", e);
      setOrgs([]);
      setActionError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setDomain("");
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

    const domainTrimmed = domain.trim();
    let domainToSend: string | undefined;
    if (domainTrimmed) {
      const normalized = normalizeOrganisationDomainInput(domainTrimmed);
      if (!normalized || !isLikelyOrganisationDomain(normalized)) {
        setFormError("Domænet ser ikke gyldigt ud. Brug fx firmadomain.dk uden https://.");
        return;
      }
      domainToSend = normalized;
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

    const body = {
      contactName: contact,
      email: em,
      organisationName: co,
      role,
      ...(domainToSend ? { domain: domainToSend } : {}),
    };

    console.log("Opretter kunde:", body);

    try {
      const res = await fetch("/api/admin/invite-customer", {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status >= 300 && res.status < 400) {
        console.warn("[admin/customers] invite-customer redirect", res.status, res.headers.get("location"));
        setFormError(
          "Du blev sendt væk fra API’et (typisk udløbet session). Genindlæs siden og log ind som admin igen.",
        );
        setSubmitting(false);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[admin/customers] invite-customer non-JSON", res.status, text.slice(0, 500));
        setFormError(
          "Uventet svar fra serveren (ikke JSON). Tjek at du er logget ind i admin, og prøv igen.",
        );
        setSubmitting(false);
        return;
      }

      const data = (await res.json()) as { error?: string; ok?: boolean; warning?: string; organisation_id?: string };
      console.log("API response:", res.status, data);

      if (!res.ok || !data.ok) {
        setFormError(data.error ?? "Noget gik galt. Prøv igen.");
        setSubmitting(false);
        return;
      }

      if (typeof data.warning === "string" && data.warning.trim()) {
        setActionError(data.warning.trim());
      }

      setSubmitting(false);
      closeModal();
      router.refresh();
      await loadData();
    } catch (err) {
      console.error("[admin/customers] invite-customer fetch failed", err);
      setFormError("Netværksfejl eller uventet afbrydelse. Prøv igen.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F2D] md:text-3xl">Kunder</h1>
          <p className="mt-2 text-sm text-[#4A8CB5]">Organisationer med brugere og invitationer.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0]"
        >
          Ny kunde
        </button>
      </div>

      {actionError ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p> : null}

      {loading ? (
        <p className="mt-10 text-sm text-slate-500">Henter kunder...</p>
      ) : orgs.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">
          Ingen kunder endnu. Opret den første med &quot;Ny kunde&quot;.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4">
          {orgs.map((org) => {
            const profiles = org.profiles ?? [];
            const pendingInvites = (org.invitations ?? []).filter((inv) => !inv.accepted_at);
            const statusActive = profiles.length > 0;
            const stack = profiles.slice(0, 3);

            return (
              <Link
                key={org.id}
                href={`/admin/customers/${org.id}`}
                className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <OrganisationLogo
                      logoUrl={
                        org.logo_url?.trim()
                          ? withCacheBust(org.logo_url.trim(), mediaVersion || undefined)
                          : null
                      }
                      initials={initialsFromName(org.name)}
                      className="h-10 w-10 text-sm"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-[#0D1F2D]">{org.name}</h2>
                      <p className="mt-1 text-sm text-[#4A8CB5]">
                        {profiles.length} aktive brugere · {pendingInvites.length} afventende invitationer
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      statusActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {statusActive ? "Aktiv" : "Afventer"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {stack.length === 0 ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                        ?
                      </div>
                    ) : (
                      stack.map((profile, index) => {
                        const initials =
                          profile.avatar_initials?.trim().slice(0, 2).toUpperCase() ||
                          initialsFromName(profile.full_name || profile.email || "U");
                        return (
                          <ProfileAvatar
                            key={profile.id}
                            avatarUrl={
                              profile.avatar_url?.trim()
                                ? withCacheBust(profile.avatar_url.trim(), mediaVersion || undefined)
                                : null
                            }
                            initials={initials}
                            className="h-10 w-10 border-2 border-white text-xs"
                            style={{ marginLeft: index === 0 ? 0 : -10, zIndex: 30 - index }}
                          />
                        );
                      })
                    )}
                  </div>
                  <span className="text-sm font-semibold text-sky-700">Se detaljer →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} titleId="create-customer-title">
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-600 md:text-sm"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-600 md:text-sm"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-600 md:text-sm"
                  placeholder="kunde@firma.dk"
                />
              </div>
              <div>
                <label htmlFor="cust-domain" className="mb-1 block text-sm font-medium text-slate-700">
                  Domæne
                </label>
                <input
                  id="cust-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-600 md:text-sm"
                  placeholder="firmadomain.dk (valgfrit)"
                  autoComplete="off"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-600 md:text-sm"
                >
                  <option value="org_admin">Administrator</option>
                  <option value="member">Medlem</option>
                </select>
              </div>

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
                  className="rounded-full bg-[#0A6EBD] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0] disabled:opacity-50"
                >
                  {submitting ? "Opretter..." : "Opret"}
                </button>
              </div>
          {formError ? <p className="mt-2 text-sm text-red-500">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  );
}
