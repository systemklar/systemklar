"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { StatusBadge, formatDanishDateTime } from "@/components/tickets/StatusBadge";

type OrgProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_initials: string | null;
  created_at: string | null;
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

export default function AdminCustomerDetailPage() {
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
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setDeleteBusy(false);
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke slette virksomhed.");
      return;
    }
    router.push("/admin/customers");
  };

  if (loading) return <p className="text-sm text-slate-600">Indlaeser virksomhed...</p>;

  if (!org) {
    return (
      <div>
        <Link href="/admin/customers" className="text-sm font-semibold text-sky-700 hover:underline">
          ← Kunder
        </Link>
        <p className="mt-6 text-sm text-slate-600">
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

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin/customers" className="text-sm font-semibold text-sky-700 hover:underline">
              ← Kunder
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-[#0D1F2D]">{org.name}</h1>
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
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Inviter bruger
          </button>
        </div>
      </header>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0D1F2D]">Brugere</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profiles.map((p) => (
            <article key={p.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                  {initialsOf(p)}
                </div>
                <div>
                  <p className="font-semibold text-[#0D1F2D]">{p.full_name || p.email || "Ukendt bruger"}</p>
                  <p className="text-sm text-[#4A8CB5]">{p.email || "—"}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${
                      p.role === "org_admin" ? "bg-sky-100 text-sky-700" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {p.role === "org_admin" ? "Administrator" : "Medlem"}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">Oprettet {formatDanishDateTime(p.created_at || "")}</p>
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
                  <p className="font-semibold text-[#0D1F2D]">{inv.contact_name || inv.email || "Invitation"}</p>
                  <p className="text-sm text-[#4A8CB5]">{inv.email || "—"}</p>
                  <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Afventer
                  </span>
                  <p className="mt-2 text-xs text-slate-500">Inviteret {formatDanishDateTime(inv.created_at || "")}</p>
                </div>
              </div>
            </article>
          ))}

          {profiles.length === 0 && pendingInvites.length === 0 ? (
            <p className="text-sm text-slate-600">Ingen brugere eller invitationer endnu.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0D1F2D]">Supportssager</h2>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Ingen sager endnu
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-b border-sky-50 last:border-b-0">
                <Link
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-sky-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[#0D1F2D]">{ticket.title || "Uden titel"}</p>
                    <p className="text-xs text-slate-500">{ticket.created_by_name || "Ukendt afsender"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{formatDanishDateTime(ticket.created_at || "")}</span>
                    <StatusBadge status={ticket.status || "open"} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#0D1F2D]">Systemer</h2>
        {systems.length === 0 ? (
          <p className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Ingen systemer endnu
          </p>
        ) : (
          <ul className="space-y-3">
            {systems.map((system) => {
              const status = system.status === "advarsel" || system.status === "nede" ? system.status : "ok";
              return (
                <li key={system.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#0D1F2D]">{system.name || "Ukendt system"}</p>
                      <p className="text-sm text-[#4A8CB5]">{system.type || "—"}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${systemStatusStyles[status]}`}>
                        {systemStatusLabel[status]}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Sidst tjekket {system.last_checked ? formatDanishDateTime(system.last_checked) : "—"}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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

      {inviteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setInviteModalOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0D1F2D]">Inviter bruger</h3>
            <form className="mt-4 space-y-4" onSubmit={(e) => void sendInvite(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">Kontaktpersonens fulde navn</label>
                <input
                  type="text"
                  value={inviteContactName}
                  onChange={(e) => setInviteContactName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value === "org_admin" ? "org_admin" : "member")}
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="member">Medlem</option>
                  <option value="org_admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={inviteSaving}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
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
