"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { createClient } from "@/lib/supabase";

type TeamProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  avatar_initials: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function PortalTeamPage() {
  const supabase = useMemo(() => createClient(), []);
  const session = usePortalSession();
  const [members, setMembers] = useState<TeamProfile[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [savingInvite, setSavingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organisationId = session?.organisationId ?? null;
  const isOrgAdmin = session?.role === "org_admin";

  const load = useCallback(async () => {
    if (!organisationId) {
      setMembers([]);
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,role,avatar_initials")
        .eq("organisation_id", organisationId)
        .order("full_name", { ascending: true }),
      supabase
        .from("invitations")
        .select("id,email,role,created_at")
        .eq("organisation_id", organisationId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (membersRes.error) {
      setError(membersRes.error.message);
      setMembers([]);
    } else {
      setMembers((membersRes.data ?? []) as TeamProfile[]);
    }

    if (invitesRes.error) {
      setPending([]);
    } else {
      setPending((invitesRes.data ?? []) as PendingInvite[]);
    }
    setLoading(false);
  }, [organisationId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organisationId) return;
    setSavingInvite(true);
    setError(null);

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole === "org_admin" ? "org_admin" : "member",
        organisation_id: organisationId,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingInvite(false);
    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke sende invitation.");
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setModalOpen(false);
    void load();
  };

  const cancelInvite = async (inviteId: string) => {
    const { error: cancelError } = await supabase.from("invitations").delete().eq("id", inviteId);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    void load();
  };

  return (
    <PortalLayout activeNav="team">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-[#0D1F2D]">Team</h1>
          {isOrgAdmin ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Inviter kollega
            </button>
          ) : null}
        </div>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-[#4A8CB5]">Henter team...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {members.map((member) => {
              const initials =
                member.avatar_initials ||
                (member.full_name ?? "")
                  .split(/\s+/)
                  .map((x) => x[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ||
                "??";
              return (
                <article key={member.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-700">
                      {initials}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#0D1F2D]">
                        {member.full_name || "Ukendt navn"}{" "}
                        {member.id === session?.userId ? <span className="text-xs text-slate-500">(dig)</span> : null}
                      </p>
                      <p className="text-sm text-[#4A8CB5]">{member.email || "—"}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${
                          member.role === "org_admin"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {member.role === "org_admin" ? "Administrator" : "Medlem"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {isOrgAdmin ? (
          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0D1F2D]">Afventende invitationer</h2>
            {pending.length === 0 ? (
              <p className="mt-2 text-sm text-[#4A8CB5]">Ingen afventende invitationer.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pending.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-[#F8FCFF] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#0D1F2D]">{invite.email}</p>
                      <p className="text-xs text-[#4A8CB5]">
                        Inviteret {new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(invite.created_at))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void cancelInvite(invite.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Annuller
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              <h3 className="text-lg font-semibold text-[#0D1F2D]">Inviter kollega</h3>
            </div>
            <form className="space-y-4" onSubmit={(e) => void handleInvite(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">E-mail</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="member">Medlem</option>
                  <option value="org_admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                  Annuller
                </button>
                <button type="submit" disabled={savingInvite} className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {savingInvite ? "Sender..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PortalLayout>
  );
}
