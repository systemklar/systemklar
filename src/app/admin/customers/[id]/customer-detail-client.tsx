"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { AdminOnboardingSystemsTabs } from "@/components/admin/AdminOnboardingSystemsTabs";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { ProfileAvatar } from "@/components/admin/ProfileAvatar";
import { withCacheBust } from "@/lib/storage-public-urls";
import { StatusBadge, formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { TicketNumberBadge } from "@/components/tickets/TicketNumberBadge";
import { isLikelyOrganisationDomain, normalizeOrganisationDomainInput } from "@/lib/organisation-domain";

type OrgProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_initials: string | null;
  avatar_url: string | null;
  created_at: string | null;
  /** Valgte systemnavne fra kunde-onboarding (`profiles.onboarding_systems`). */
  onboarding_systems?: string[] | null;
};

type OrgInvitation = {
  id: string;
  email: string | null;
  contact_name: string | null;
  role: string | null;
  accepted_at: string | null;
  created_at: string | null;
};

type OrgTicket = {
  id: string;
  ticket_number: number | null;
  title: string | null;
  status: string | null;
  created_by_name: string | null;
  created_at: string | null;
};

type OrgSystem = {
  id: string;
  name: string | null;
  type: "cloud" | "server" | "netværk" | "software" | null;
  status: "ok" | "advarsel" | "nede" | null;
  last_checked: string | null;
};

type OrganisationDetail = {
  id: string;
  name: string;
  created_at: string;
  logo_url: string | null;
  /** Website hostname uden protokol (fx benjasmod.dk). */
  domain: string | null;
  profiles: OrgProfile[] | null;
  invitations: OrgInvitation[] | null;
  tickets: OrgTicket[] | null;
  systems: OrgSystem[] | null;
};

const systemStatusStyles: Record<"ok" | "advarsel" | "nede", string> = {
  ok: "bg-green-100 text-green-800",
  advarsel: "bg-amber-100 text-amber-800",
  nede: "bg-red-100 text-red-800",
};

const systemStatusLabel: Record<"ok" | "advarsel" | "nede", string> = {
  ok: "OK",
  advarsel: "Advarsel",
  nede: "Nede",
};

function initialsOf(profile: OrgProfile | OrgInvitation) {
  const source =
    ("full_name" in profile ? profile.full_name : profile.contact_name) ||
    profile.email ||
    "U";
  return source
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function profileDisplayInitials(profile: OrgProfile): string {
  const fromDb = profile.avatar_initials?.trim();
  if (fromDb) return fromDb.slice(0, 2).toUpperCase();
  return initialsOf(profile);
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminCustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [org, setOrg] = useState<OrganisationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteContactName, setInviteContactName] = useState("");
  const [inviteRole, setInviteRole] = useState<"org_admin" | "member">("member");
  const [inviteSaving, setInviteSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [domainEditing, setDomainEditing] = useState(false);
  const [domainDraft, setDomainDraft] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainFieldError, setDomainFieldError] = useState<string | null>(null);
  const [monitoringRunBusy, setMonitoringRunBusy] = useState(false);
  const [monitoringRefreshNonce, setMonitoringRefreshNonce] = useState(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [confirmRemoveProfileId, setConfirmRemoveProfileId] = useState<string | null>(null);
  const [removingProfileId, setRemovingProfileId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setOrg(null);
      setNotFound(false);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/admin/organisations/${encodeURIComponent(id)}`, {
        credentials: "include",
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        console.warn("[admin/customers/[id]] organisation redirect", res.status);
        setOrg(null);
        setNotFound(false);
        setError("Session udløbet. Genindlæs siden og log ind igen.");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[admin/customers/[id]] non-JSON", res.status, text.slice(0, 300));
        setOrg(null);
        setNotFound(false);
        setError("Uventet svar fra serveren.");
        return;
      }

      const payload = (await res.json()) as { error?: string; organisation?: unknown };

      if (res.status === 404) {
        setOrg(null);
        setNotFound(true);
        setError(null);
        return;
      }

      if (!res.ok) {
        setOrg(null);
        setNotFound(false);
        setError(payload.error ?? "Kunne ikke hente virksomhed.");
        return;
      }

      if (!payload.organisation) {
        setOrg(null);
        setNotFound(true);
        setError(null);
        return;
      }

      setOrg(payload.organisation as OrganisationDetail);
      setMediaVersion(Date.now());
    } catch (e) {
      console.error("[admin/customers/[id]] fetch organisation", e);
      setOrg(null);
      setNotFound(false);
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    setDomainEditing(false);
    setDomainDraft("");
    setDomainFieldError(null);
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const removeMember = async (profileId: string) => {
    if (!org) return;
    setRemovingProfileId(profileId);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/organisations/${encodeURIComponent(org.id)}/members/${encodeURIComponent(profileId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const payload = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(payload.error ?? "Kunne ikke fjerne brugeren.");
        return;
      }

      setOrg((prev) =>
        prev
          ? {
              ...prev,
              profiles: (prev.profiles ?? []).filter((p) => p.id !== profileId),
            }
          : prev,
      );
      setConfirmRemoveProfileId(null);
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setRemovingProfileId(null);
    }
  };

  const onboardingSystemNames = useMemo(() => {
    const list = org?.profiles ?? [];
    const names = new Set<string>();
    for (const p of list) {
      const arr = p.onboarding_systems;
      if (!Array.isArray(arr)) continue;
      for (const n of arr) {
        const t = typeof n === "string" ? n.trim() : "";
        if (t) names.add(t);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, "da"));
  }, [org?.profiles]);

  const sendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!org) return;
    const email = inviteEmail.trim().toLowerCase();
    const contact = inviteContactName.trim();
    if (!email || !contact) {
      setError("Udfyld navn og email.");
      return;
    }

    setInviteSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/organisations/${org.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email,
        contact_name: contact,
        role: inviteRole,
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setInviteSaving(false);
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke sende invitation.");
      return;
    }
    setInviteEmail("");
    setInviteContactName("");
    setInviteRole("member");
    setInviteModalOpen(false);
    void load();
  };

  const beginDomainEdit = () => {
    if (!org) return;
    setDomainFieldError(null);
    setDomainDraft(org.domain ?? "");
    setDomainEditing(true);
  };

  const cancelDomainEdit = () => {
    setDomainEditing(false);
    setDomainFieldError(null);
    setDomainDraft("");
  };

  const saveDomain = async () => {
    if (!org) return;
    const normalized = normalizeOrganisationDomainInput(domainDraft);
    if (domainDraft.trim() !== "" && normalized === "") {
      setDomainFieldError("Kunne ikke tolke input. Fjern https:// og stier — brug fx benjasmod.dk.");
      return;
    }
    if (!isLikelyOrganisationDomain(normalized)) {
      setDomainFieldError("Indtast et gyldigt domæne med punktum, fx benjasmod.dk.");
      return;
    }

    setDomainSaving(true);
    setDomainFieldError(null);
    setError(null);
    const res = await fetch(`/api/admin/organisations/${encodeURIComponent(org.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ domain: normalized === "" ? null : normalized }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      organisation?: OrganisationDetail;
    };
    setDomainSaving(false);
    if (!res.ok) {
      setDomainFieldError(payload.error ?? "Kunne ikke gemme domæne.");
      return;
    }
    if (payload.organisation) {
      setOrg(payload.organisation);
    }
    setDomainEditing(false);
    setDomainDraft("");
  };

  const deleteOrganisation = async () => {
    if (!org) return;
    const ok = window.confirm(
      `Er du sikker? Dette sletter alle brugere, sager og data for ${org.name}.`
    );
    if (!ok) return;
    setDeleteBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/organisations/${org.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };
    setDeleteBusy(false);
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke slette virksomhed.");
      return;
    }
    if (payload.warning?.trim()) {
      setToast({ type: "error", message: payload.warning.trim() });
    }
    router.push("/admin/customers");
  };

  const runMonitoringNow = async () => {
    if (!org) return;
    setMonitoringRunBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/monitoring/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organisationId: org.id }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        systemsChecked?: number;
        message?: string;
      };
      if (!res.ok) {
        setToast({
          type: "error",
          message: payload.error ?? "Overvågning kunne ikke køres.",
        });
        return;
      }
      const n = typeof payload.systemsChecked === "number" ? payload.systemsChecked : 0;
      setToast({
        type: "success",
        message:
          n === 0
            ? "Overvågning færdig — ingen systemer blev tjekket."
            : `Overvågning færdig — ${n} system${n === 1 ? "" : "er"} tjekket.`,
      });
      setMonitoringRefreshNonce((k) => k + 1);
    } catch {
      setToast({ type: "error", message: "Netværksfejl. Prøv igen." });
    } finally {
      setMonitoringRunBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-[#2A4868]">Indlæser virksomhed...</p>;

  if (!org) {
    return (
      <div>
        <Link href="/admin/customers" className="text-sm font-semibold text-[#1E4490] hover:underline">
          ← Kunder
        </Link>
        <p className="mt-6 text-sm text-[#2A4868]">
          {notFound ? "Kunde ikke fundet." : error ?? "Virksomhed ikke fundet."}
        </p>
      </div>
    );
  }

  const profiles = org.profiles ?? [];
  const pendingInvites = (org.invitations ?? []).filter((i) => !i.accepted_at);
  const tickets = org.tickets ?? [];
  const systems = org.systems ?? [];
  const isActive = profiles.length > 0;
  const isOnlyMember = profiles.length <= 1;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-[#CBD5E8] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin/customers" className="text-sm font-semibold text-[#1E4490] hover:underline">
              ← Kunder
            </Link>
            <div className="mt-3 flex items-center gap-4">
              <OrganisationLogo
                logoUrl={
                  org.logo_url?.trim()
                    ? withCacheBust(org.logo_url.trim(), mediaVersion || undefined)
                    : null
                }
                initials={initialsFromName(org.name)}
                className="h-14 w-14 text-lg"
              />
              <h1 className="text-3xl font-bold text-[#0A1628]">{org.name}</h1>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6A82A8]">Domæne</p>
              {domainEditing ? (
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <input
                    type="text"
                    value={domainDraft}
                    onChange={(e) => setDomainDraft(e.target.value)}
                    placeholder="benjasmod.dk"
                    autoFocus
                    disabled={domainSaving}
                    className="min-w-[12rem] max-w-md flex-1 rounded-lg border border-[#CBD5E8] px-3 py-2 text-sm text-[#0A1628] outline-none focus:border-[#E4EAF5]0 disabled:opacity-60"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={domainSaving}
                      onClick={() => void saveDomain()}
                      className="rounded-full bg-[#2952A3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1E4490] disabled:opacity-50"
                    >
                      {domainSaving ? "Gemmer..." : "Gem"}
                    </button>
                    <button
                      type="button"
                      disabled={domainSaving}
                      onClick={cancelDomainEdit}
                      className="rounded-full px-4 py-2 text-sm text-[#2A4868] hover:bg-[#EEF2FA] disabled:opacity-50"
                    >
                      Annuller
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={beginDomainEdit}
                    aria-label={org.domain ? `Rediger domæne (${org.domain})` : "Tilføj domæne"}
                    className="group inline-flex max-w-full items-center gap-2 rounded-lg py-0.5 text-left text-sm text-[#0A1628] hover:bg-[#E8EEFC]/80"
                  >
                    <span className={org.domain ? "font-medium" : "italic text-[#6A82A8]"}>
                      {org.domain ?? "Ikke angivet — klik for at tilføje"}
                    </span>
                    <span className="inline-flex shrink-0 rounded-md p-1 text-[#2A4868] group-hover:text-[#1E4490]" aria-hidden>
                      <Pencil className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}
              {domainFieldError ? <p className="mt-1 text-xs text-red-600">{domainFieldError}</p> : null}
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isActive ? "Aktiv" : "Afventer"}
              </span>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Link
                href={`/admin/customers/${org.id}/dashboard`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#CBD5E8] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#1E4490] shadow-sm transition hover:border-[#CBD5E8] hover:bg-[#E8EEFC]"
              >
                Se kundens dashboard
              </Link>
              <button
                type="button"
                disabled={monitoringRunBusy}
                onClick={() => void runMonitoringNow()}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#CBD5E8] bg-white px-5 py-2.5 text-sm font-semibold text-[#2A4868] shadow-sm transition hover:border-[#CBD5E8] hover:bg-[#F2F5FA] disabled:pointer-events-none disabled:opacity-50"
              >
                {monitoringRunBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    Kører...
                  </>
                ) : (
                  "Kør monitoring nu"
                )}
              </button>
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#2952A3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E4490]"
              >
                Inviter bruger
              </button>
            </div>
          </div>
        </div>
      </header>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0A1628]">Brugere</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profiles.map((p) => (
            <article key={p.id} className="rounded-2xl border border-[#CBD5E8] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  avatarUrl={
                    p.avatar_url?.trim()
                      ? withCacheBust(p.avatar_url.trim(), mediaVersion || undefined)
                      : null
                  }
                  initials={profileDisplayInitials(p)}
                  className="h-10 w-10 text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0A1628]">{p.full_name || p.email || "Ukendt bruger"}</p>
                  <p className="text-sm text-[#2A4868]">{p.email || "—"}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${
                      p.role === "org_admin" ? "bg-[#E8EEFC] text-[#1E4490]" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {p.role === "org_admin" ? "Administrator" : "Medlem"}
                  </span>
                  <p className="mt-2 text-xs text-[#6A82A8]">Oprettet {formatDanishDateTime(p.created_at || "")}</p>

                  {confirmRemoveProfileId === p.id ? (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50/60 p-3">
                      <p className="text-xs text-red-800">
                        Er du sikker? Dette fjerner brugerens adgang til organisationen.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={removingProfileId === p.id}
                          onClick={() => void removeMember(p.id)}
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {removingProfileId === p.id ? "Fjerner…" : "Ja, fjern"}
                        </button>
                        <button
                          type="button"
                          disabled={removingProfileId === p.id}
                          onClick={() => setConfirmRemoveProfileId(null)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-[#2A4868] hover:bg-white disabled:opacity-50"
                        >
                          Annuller
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOnlyMember}
                      title={isOnlyMember ? "Kan ikke fjerne sidste medlem" : undefined}
                      onClick={() => setConfirmRemoveProfileId(p.id)}
                      className="mt-3 text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-[#9AAAC8]"
                    >
                      Fjern
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {pendingInvites.map((inv) => (
            <article key={inv.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                  {initialsOf(inv)}
                </div>
                <div>
                  <p className="font-semibold text-[#0A1628]">{inv.contact_name || inv.email || "Invitation"}</p>
                  <p className="text-sm text-[#2A4868]">{inv.email || "—"}</p>
                  <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Afventer
                  </span>
                  <p className="mt-2 text-xs text-[#6A82A8]">Inviteret {formatDanishDateTime(inv.created_at || "")}</p>
                </div>
              </div>
            </article>
          ))}

          {profiles.length === 0 && pendingInvites.length === 0 ? (
            <p className="text-sm text-[#2A4868]">Ingen brugere eller invitationer endnu.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0A1628]">Supportssager</h2>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border border-[#CBD5E8] bg-white p-5 text-sm text-[#2A4868] shadow-sm">
            Ingen sager endnu
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[#CBD5E8] bg-white shadow-sm">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-b border-[#E4EAF5] last:border-b-0">
                <Link
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-[#E8EEFC] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TicketNumberBadge ticketNumber={ticket.ticket_number} />
                      <p className="font-medium text-[#0A1628]">{ticket.title || "Uden titel"}</p>
                    </div>
                    <p className="text-xs text-[#6A82A8]">{ticket.created_by_name || "Ukendt afsender"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6A82A8]">{formatDanishDateTime(ticket.created_at || "")}</span>
                    <StatusBadge status={ticket.status || "open"} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0A1628]">Systemer</h2>
        <div className="space-y-4">
          {onboardingSystemNames.length > 0 ? (
            <div className="space-y-3">
              <AdminOnboardingSystemsTabs
                storedNames={onboardingSystemNames}
                organisationId={org.id}
                monitoringRefreshNonce={monitoringRefreshNonce}
              />
              <p className="text-xs text-[#6A82A8]">Valgt under onboarding</p>
            </div>
          ) : null}

          {systems.length === 0 && onboardingSystemNames.length === 0 ? (
            <p className="rounded-2xl border border-[#CBD5E8] bg-white p-5 text-sm text-[#2A4868] shadow-sm">
              Ingen systemer endnu
            </p>
          ) : null}

          {systems.length > 0 ? (
            <ul className="space-y-3">
              {systems.map((system) => {
                const status = system.status === "advarsel" || system.status === "nede" ? system.status : "ok";
                return (
                  <li key={system.id} className="rounded-2xl border border-[#CBD5E8] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#0A1628]">{system.name || "Ukendt system"}</p>
                        <p className="text-sm text-[#2A4868]">{system.type || "—"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${systemStatusStyles[status]}`}>
                          {systemStatusLabel[status]}
                        </span>
                        <p className="mt-2 text-xs text-[#6A82A8]">
                          Sidst tjekket {system.last_checked ? formatDanishDateTime(system.last_checked) : "—"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-800">Farlige handlinger</h2>
        <p className="mt-2 text-sm text-red-700">
          Slet virksomhed og alle tilknyttede brugere, sager og data.
        </p>
        <button
          type="button"
          onClick={() => void deleteOrganisation()}
          disabled={deleteBusy}
          className="mt-4 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleteBusy ? "Sletter..." : "Slet virksomhed"}
        </button>
      </section>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {inviteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0A1628]/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setInviteModalOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E8] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0A1628]">Inviter bruger</h3>
            <form className="mt-4 space-y-4" onSubmit={(e) => void sendInvite(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0A1628]">Kontaktpersonens fulde navn</label>
                <input
                  type="text"
                  value={inviteContactName}
                  onChange={(e) => setInviteContactName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#CBD5E8] px-3 py-2 text-sm outline-none focus:border-[#E4EAF5]0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0A1628]">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#CBD5E8] px-3 py-2 text-sm outline-none focus:border-[#E4EAF5]0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0A1628]">Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value === "org_admin" ? "org_admin" : "member")}
                  className="w-full rounded-lg border border-[#CBD5E8] px-3 py-2 text-sm outline-none focus:border-[#E4EAF5]0"
                >
                  <option value="member">Medlem</option>
                  <option value="org_admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-[#2A4868] hover:bg-[#EEF2FA]"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={inviteSaving}
                  className="rounded-full bg-[#2952A3] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1E4490] disabled:opacity-60"
                >
                  {inviteSaving ? "Sender..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
