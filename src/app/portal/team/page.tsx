"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Camera, Loader2, Users } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { createClient } from "@/lib/supabase";

type TeamProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  avatar_initials: string | null;
  created_at: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type MyProfile = {
  id: string;
  organisation_id: string | null;
  role: string | null;
};

type Organisation = {
  id: string;
  name: string;
};

const dateFmt = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" });

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PortalTeamPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [organisationName, setOrganisationName] = useState<string>("");
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [members, setMembers] = useState<TeamProfile[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);

  const [orgAvatarUrl, setOrgAvatarUrl] = useState<string | null>(null);
  const [orgAvatarBroken, setOrgAvatarBroken] = useState(false);
  const [uploadingOrgAvatar, setUploadingOrgAvatar] = useState(false);
  const orgFileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [savingInvite, setSavingInvite] = useState(false);

  const refreshOrgAvatarUrl = useCallback(
    (orgId: string) => {
      const { data } = supabase.storage.from("organisation-avatars").getPublicUrl(orgId);
      setOrgAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      setOrgAvatarBroken(false);
    },
    [supabase]
  );

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[portal/team] auth.getUser fejlede", authError);
      setError("Kunne ikke hente brugersession. Prøv at logge ud og ind igen.");
      setLoading(false);
      return;
    }
    if (!authData.user) {
      console.error("[portal/team] ingen authenticated user fundet");
      setError("Du er ikke logget ind. Log venligst ind igen.");
      setLoading(false);
      return;
    }
    const authUser = authData.user;
    setAuthUserId(authUser.id);

    const myProfileColumns = "id,organisation_id,role";

    const { data: meData, error: meError } = await supabase
      .from("profiles")
      .select(myProfileColumns)
      .eq("id", authUser.id)
      .maybeSingle();

    if (meError) {
      console.error("[portal/team] egen profil select fejlede", meError);
      setError(`Kunne ikke hente profil: ${meError.message}`);
      setLoading(false);
      return;
    }
    let myProfile = (Array.isArray(meData) ? meData[0] : meData) as MyProfile | null | undefined;

    if (!myProfile) {
      const { data: byUserIdData, error: byUserIdError } = await supabase
        .from("profiles")
        .select(myProfileColumns)
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (byUserIdError && byUserIdError.code !== "42703") {
        console.error("[portal/team] user_id-fallback fejlede", byUserIdError);
      } else if (byUserIdData) {
        console.warn("[portal/team] fandt egen profil via user_id-fallback for", authUser.id);
        myProfile = (Array.isArray(byUserIdData) ? byUserIdData[0] : byUserIdData) as MyProfile;
      }
    }

    if (!myProfile) {
      console.error("[portal/team] egen profil ikke fundet for", authUser.id);
      setError(
        "Din profil blev ikke fundet i databasen. Kontakt support på kontakt@systemklar.dk."
      );
      setLoading(false);
      return;
    }

    const orgId = myProfile.organisation_id;
    setOrganisationId(orgId);
    setIsOrgAdmin(myProfile.role === "org_admin");

    if (!orgId) {
      console.error("[portal/team] bruger uden organisation", authUser.id);
      setError("Du er ikke tilknyttet en organisation endnu. Kontakt din administrator.");
      setLoading(false);
      return;
    }

    const [orgRes, membersRes, invitesRes] = await Promise.all([
      supabase.from("organisations").select("id,name").eq("id", orgId).maybeSingle(),
      supabase
        .from("profiles")
        .select("id,email,full_name,role,avatar_initials,created_at")
        .eq("organisation_id", orgId)
        .order("full_name", { ascending: true }),
      supabase
        .from("invitations")
        .select("id,email,role,created_at")
        .eq("organisation_id", orgId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (orgRes.error) {
      console.error("[portal/team] organisation select fejlede", orgRes.error);
      setError(`Kunne ikke hente organisation: ${orgRes.error.message}`);
      setLoading(false);
      return;
    }
    const orgRow = (Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data) as
      | Organisation
      | null
      | undefined;
    setOrganisationName(orgRow?.name ?? "");

    if (membersRes.error) {
      console.error("[portal/team] members select fejlede", membersRes.error);
      setError(`Kunne ikke hente teammedlemmer: ${membersRes.error.message}`);
      setMembers([]);
    } else {
      setMembers((membersRes.data ?? []) as TeamProfile[]);
    }

    if (invitesRes.error) {
      console.error("[portal/team] invitations select fejlede", invitesRes.error);
      setPending([]);
    } else {
      setPending((invitesRes.data ?? []) as PendingInvite[]);
    }

    refreshOrgAvatarUrl(orgId);
    setLoading(false);
  }, [supabase, refreshOrgAvatarUrl]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const onOrgAvatarPick = () => {
    if (!isOrgAdmin || uploadingOrgAvatar) return;
    orgFileInputRef.current?.click();
  };

  const onOrgAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organisationId) return;
    setUploadingOrgAvatar(true);
    setError(null);
    setSuccess(null);

    const { error: upError } = await supabase.storage
      .from("organisation-avatars")
      .upload(organisationId, file, {
        upsert: true,
        contentType: file.type || "image/png",
      });
    setUploadingOrgAvatar(false);

    if (upError) {
      console.error("[portal/team] org avatar upload fejlede", upError);
      setError(`Kunne ikke uploade logo: ${upError.message}`);
      event.target.value = "";
      return;
    }

    refreshOrgAvatarUrl(organisationId);
    setSuccess("Organisationens logo er opdateret.");
    event.target.value = "";
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organisationId || !isOrgAdmin) return;
    setSavingInvite(true);
    setError(null);
    setSuccess(null);

    const targetEmail = inviteEmail.trim().toLowerCase();
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: targetEmail,
        role: inviteRole === "org_admin" ? "org_admin" : "member",
        organisation_id: organisationId,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingInvite(false);

    if (!res.ok) {
      console.error("[portal/team] /api/invite fejlede", payload.error);
      setError(payload.error ?? "Kunne ikke sende invitation.");
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setModalOpen(false);
    setSuccess(`Invitation sendt til ${targetEmail}.`);
    void loadTeam();
  };

  const cancelInvite = async (inviteId: string) => {
    if (!isOrgAdmin) return;
    const { error: cancelError } = await supabase
      .from("invitations")
      .delete()
      .eq("id", inviteId);
    if (cancelError) {
      console.error("[portal/team] cancel invitation fejlede", cancelError);
      setError(cancelError.message);
      return;
    }
    void loadTeam();
  };

  const orgInitials = buildInitials(organisationName) || "??";

  return (
    <PortalLayout activeNav="team">
      <div className="space-y-6">
        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <button
              type="button"
              onClick={onOrgAvatarPick}
              disabled={!isOrgAdmin || uploadingOrgAvatar}
              aria-label={
                isOrgAdmin ? "Skift organisationens logo" : "Organisationens logo"
              }
              className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-2xl font-bold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-default"
            >
              {orgAvatarUrl && !orgAvatarBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={orgAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setOrgAvatarBroken(true)}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  {orgInitials}
                </span>
              )}
              {isOrgAdmin ? (
                <span
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition ${
                    uploadingOrgAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {uploadingOrgAvatar ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </span>
              ) : null}
            </button>
            <input
              ref={orgFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onOrgAvatarFileChange(e)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7AAEC8]">
                Organisation
              </p>
              <h1 className="truncate text-2xl font-bold text-[#0D1F2D] md:text-3xl">
                {organisationName || (loading ? "—" : "Ukendt")}
              </h1>
              <p className="mt-1 text-sm text-[#4A8CB5]">
                {members.length} {members.length === 1 ? "medlem" : "medlemmer"}
                {pending.length > 0
                  ? ` · ${pending.length} afventende invitation${
                      pending.length === 1 ? "" : "er"
                    }`
                  : ""}
              </p>
            </div>
            {isOrgAdmin ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="hidden shrink-0 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 md:inline-block"
              >
                Inviter kollega
              </button>
            ) : null}
          </div>
          {isOrgAdmin ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 w-full rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 md:hidden"
            >
              Inviter kollega
            </button>
          ) : null}
        </section>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        ) : null}

        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-sky-50 pb-3 text-base font-semibold text-[#0D1F2D]">
            Teammedlemmer
          </h2>
          {loading ? (
            <p className="text-sm text-[#4A8CB5]">Henter team…</p>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-[#0D1F2D]">Dit team er tomt</p>
              <p className="max-w-md text-sm text-[#4A8CB5]">
                Inviter dine kolleger via email, så de kan dele adgang til systemklar.
              </p>
              {isOrgAdmin ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Inviter første kollega
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {members.map((member) => {
                const initials =
                  member.avatar_initials ||
                  buildInitials(member.full_name ?? "") ||
                  "??";
                const joined = member.created_at
                  ? dateFmt.format(new Date(member.created_at))
                  : null;
                return (
                  <article
                    key={member.id}
                    className="rounded-xl border border-sky-100 bg-[#FBFDFE] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-bold text-sky-700">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0D1F2D]">
                          {member.full_name || "Ukendt navn"}
                          {member.id === authUserId ? (
                            <span className="ml-1 text-xs font-normal text-[#7AAEC8]">
                              (dig)
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-[#4A8CB5]">
                          {member.email || "—"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                              member.role === "org_admin"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {member.role === "org_admin" ? "Administrator" : "Medlem"}
                          </span>
                          {joined ? (
                            <span className="text-[11px] text-[#7AAEC8]">
                              Tilføjet {joined}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isOrgAdmin ? (
          <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 border-b border-sky-50 pb-3 text-base font-semibold text-[#0D1F2D]">
              Afventende invitationer
            </h2>
            {loading ? (
              <p className="text-sm text-[#4A8CB5]">Henter…</p>
            ) : pending.length === 0 ? (
              <p className="text-sm text-[#4A8CB5]">Ingen afventende invitationer.</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-[#F8FCFF] px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0D1F2D]">
                        {invite.email}
                      </p>
                      <p className="text-xs text-[#4A8CB5]">
                        {invite.role === "org_admin" ? "Administrator" : "Medlem"} ·
                        inviteret {dateFmt.format(new Date(invite.created_at))}
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
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              <h3 className="text-lg font-semibold text-[#0D1F2D]">Inviter kollega</h3>
            </div>
            <form className="space-y-4" onSubmit={(e) => void handleInvite(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                  Rolle
                </label>
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
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={savingInvite}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {savingInvite ? "Sender…" : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PortalLayout>
  );
}
