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
import { Camera, Loader2, Mail, Plus, UserMinus, Users } from "lucide-react";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SaveButton } from "@/components/portal/settings/SaveButton";
import { SettingsRow } from "@/components/portal/settings/SettingsRow";
import { SettingsSection } from "@/components/portal/settings/SettingsSection";
import { SettingsTabs, type SettingsTabItem } from "@/components/portal/settings/SettingsTabs";
import { SettingsToggle } from "@/components/portal/settings/SettingsToggle";
import { Modal } from "@/components/ui/Modal";
import {
  ORGANISATION_EMPLOYEE_COUNT_OPTIONS,
  ORGANISATION_INDUSTRY_OPTIONS,
} from "@/lib/organisation-settings";
import {
  organisationNotificationPreferencesToJson,
  resolveOrganisationNotificationPreferences,
  type OrganisationNotificationPreferences,
} from "@/lib/notification-preferences";
import { createClient } from "@/lib/supabase";
import { publicOrganisationLogoUrl, withCacheBust } from "@/lib/storage-public-urls";

type TeamTabId = "oversigt" | "indstillinger" | "invitationer";

type TeamProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  avatar_initials: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type Organisation = {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  employee_count: string | null;
  notification_preferences: unknown;
};

const dateFmt = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" });

const selectClass =
  "w-full max-w-xs rounded-xl border border-sky-200 px-3 py-2 text-sm text-[#0D1F2D] outline-none focus:ring-2 focus:ring-[#0A6EBD] sm:text-right";

const inputClass =
  "w-full max-w-xs rounded-xl border border-sky-200 px-3 py-2 text-sm text-[#0D1F2D] outline-none focus:ring-2 focus:ring-[#0A6EBD] sm:text-right";

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ADMIN_TABS: SettingsTabItem[] = [
  { id: "oversigt", label: "Oversigt" },
  { id: "indstillinger", label: "Indstillinger" },
  { id: "invitationer", label: "Invitationer" },
];

export default function PortalTeamPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [members, setMembers] = useState<TeamProfile[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [activeTab, setActiveTab] = useState<TeamTabId>("oversigt");

  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [uploadingOrgAvatar, setUploadingOrgAvatar] = useState(false);
  const orgFileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [savedOrgName, setSavedOrgName] = useState("");
  const [savedIndustry, setSavedIndustry] = useState("");
  const [savedEmployeeCount, setSavedEmployeeCount] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  const [orgNotifPrefs, setOrgNotifPrefs] = useState<OrganisationNotificationPreferences>({
    notify_all_system_failure: true,
    notify_all_monthly_report: true,
  });
  const [savedOrgNotifPrefs, setSavedOrgNotifPrefs] = useState(orgNotifPrefs);
  const [savingOrgNotif, setSavingOrgNotif] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [savingInvite, setSavingInvite] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<TeamProfile | null>(null);
  const [removing, setRemoving] = useState(false);

  const orgDirty =
    orgName.trim() !== savedOrgName.trim() ||
    industry !== savedIndustry ||
    employeeCount !== savedEmployeeCount;
  const orgNotifDirty = JSON.stringify(orgNotifPrefs) !== JSON.stringify(savedOrgNotifPrefs);

  const applyOrgLogoUrl = useCallback((storedUrl: string | null | undefined, orgId: string) => {
    const trimmed = storedUrl?.trim();
    if (trimmed) {
      setOrgLogoUrl(withCacheBust(trimmed));
    } else {
      setOrgLogoUrl(withCacheBust(publicOrganisationLogoUrl(orgId)));
    }
  }, []);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Du er ikke logget ind. Log venligst ind igen.");
      setLoading(false);
      return;
    }

    const authUser = authData.user;
    setAuthUserId(authUser.id);

    const { data: meData, error: meError } = await supabase
      .from("profiles")
      .select("id,organisation_id,role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (meError || !meData?.organisation_id) {
      setError(meError?.message ?? "Du er ikke tilknyttet en organisation.");
      setLoading(false);
      return;
    }

    const orgId = meData.organisation_id as string;
    setOrganisationId(orgId);
    setIsOrgAdmin(meData.role === "org_admin");

    const [orgRes, membersRes, invitesRes] = await Promise.all([
      supabase
        .from("organisations")
        .select("id,name,logo_url,industry,employee_count,notification_preferences")
        .eq("id", orgId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id,email,full_name,role,avatar_initials,avatar_url,created_at")
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
      setError(orgRes.error.message);
      setLoading(false);
      return;
    }

    const orgRow = (Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data) as Organisation | null;
    const name = orgRow?.name ?? "";
    const ind = orgRow?.industry ?? "";
    const emp = orgRow?.employee_count ?? "";
    const orgPrefs = resolveOrganisationNotificationPreferences(orgRow?.notification_preferences);

    setOrgName(name);
    setSavedOrgName(name);
    setIndustry(ind);
    setSavedIndustry(ind);
    setEmployeeCount(emp);
    setSavedEmployeeCount(emp);
    setOrgNotifPrefs(orgPrefs);
    setSavedOrgNotifPrefs(orgPrefs);
    applyOrgLogoUrl(orgRow?.logo_url, orgId);

    setMembers((membersRes.data ?? []) as TeamProfile[]);
    setPending((invitesRes.data ?? []) as PendingInvite[]);
    setLoading(false);
  }, [supabase, applyOrgLogoUrl]);

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
      .upload(organisationId, file, { upsert: true, contentType: file.type || "image/png" });

    setUploadingOrgAvatar(false);
    if (upError) {
      setError(`Kunne ikke uploade logo: ${upError.message}`);
      event.target.value = "";
      return;
    }

    const logoUrl = publicOrganisationLogoUrl(organisationId);
    const { error: logoColErr } = await supabase
      .from("organisations")
      .update({ logo_url: logoUrl })
      .eq("id", organisationId);

    if (logoColErr) {
      setError(`Logoet blev uploadet, men kunne ikke gemmes: ${logoColErr.message}`);
      event.target.value = "";
      return;
    }

    setOrgLogoUrl(withCacheBust(logoUrl));
    setSuccess("Organisationens logo er opdateret.");
    event.target.value = "";
  };

  const saveOrganisation = async () => {
    if (!organisationId || !isOrgAdmin) return;
    const trimmed = orgName.trim();
    if (trimmed.length < 2) {
      setError("Virksomhedsnavn skal være mindst 2 tegn.");
      return;
    }
    setSavingOrg(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("organisations")
      .update({
        name: trimmed,
        industry: industry || null,
        employee_count: employeeCount || null,
      })
      .eq("id", organisationId);

    setSavingOrg(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedOrgName(trimmed);
    setSavedIndustry(industry);
    setSavedEmployeeCount(employeeCount);
    setSuccess("Organisation er opdateret.");
  };

  const saveOrgNotifications = async () => {
    if (!organisationId || !isOrgAdmin) return;
    setSavingOrgNotif(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("organisations")
      .update({
        notification_preferences: organisationNotificationPreferencesToJson(orgNotifPrefs),
      })
      .eq("id", organisationId);

    setSavingOrgNotif(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedOrgNotifPrefs(orgNotifPrefs);
    setSuccess("Notifikationsindstillinger er gemt.");
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
      setError(payload.error ?? "Kunne ikke sende invitation.");
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setModalOpen(false);
    setSuccess(`Invitation sendt til ${targetEmail}.`);
    void loadTeam();
  };

  const resendInvite = async (inviteId: string) => {
    if (!isOrgAdmin) return;
    setResendingId(inviteId);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/portal/team/invitations/${inviteId}`, { method: "POST" });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setResendingId(null);

    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke sende invitationen igen.");
      return;
    }
    setSuccess("Invitationen er sendt igen.");
  };

  const cancelInvite = async (inviteId: string) => {
    if (!isOrgAdmin) return;
    const { error: cancelError } = await supabase.from("invitations").delete().eq("id", inviteId);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    setSuccess("Invitationen er annulleret.");
    void loadTeam();
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setError(null);

    const res = await fetch(`/api/portal/team/members/${removeTarget.id}`, { method: "DELETE" });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setRemoving(false);

    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke fjerne medlem.");
      return;
    }

    setRemoveTarget(null);
    setSuccess(`${removeTarget.full_name || "Medlem"} er fjernet fra teamet.`);
    void loadTeam();
  };

  const orgInitials = buildInitials(orgName) || "??";

  const renderMemberCard = (member: TeamProfile) => {
    const initials =
      member.avatar_initials?.trim().slice(0, 2).toUpperCase() ||
      buildInitials(member.full_name ?? "") ||
      "??";
    const joined = member.created_at ? dateFmt.format(new Date(member.created_at)) : null;
    const canRemove = isOrgAdmin && member.id !== authUserId && members.length > 1;

    return (
      <li
        key={member.id}
        className="flex w-[min(100%,220px)] shrink-0 flex-col items-center gap-2 rounded-2xl border border-sky-100 bg-white p-5 text-center shadow-sm"
      >
        <ProfileAvatar avatarUrl={member.avatar_url} initials={initials} className="h-16 w-16 text-lg" />
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold text-[#0D1F2D]">
            {member.full_name || "Ukendt navn"}
            {member.id === authUserId ? (
              <span className="block text-[11px] font-normal text-[#7AAEC8]">(dig)</span>
            ) : null}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              member.role === "org_admin"
                ? "bg-sky-100 text-sky-800"
                : "bg-[#F5FAFD] text-[#2C4A5E]"
            }`}
          >
            {member.role === "org_admin" ? "Administrator" : "Medlem"}
          </span>
          <p className="mt-2 truncate text-xs text-[#7AAEC8]">{member.email || "—"}</p>
          {joined ? <p className="mt-1 text-[11px] text-[#7AAEC8]">Tilføjet {joined}</p> : null}
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={() => setRemoveTarget(member)}
            className="mt-1 inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-50"
          >
            <UserMinus className="h-3 w-3" />
            Fjern
          </button>
        ) : null}
      </li>
    );
  };

  const renderOversigt = () => (
    <div className="space-y-10">
      <section className="rounded-2xl border border-sky-100 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <OrganisationLogo
            logoUrl={orgLogoUrl}
            initials={orgInitials}
            className="h-20 w-20 shrink-0 text-2xl"
          />
          <div className="min-w-0 space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#0D1F2D] sm:text-3xl">
              {orgName || "Din organisation"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {industry ? (
                <span className="rounded-full border border-sky-100 bg-[#F5FAFD] px-3 py-1 text-xs font-medium text-[#2C4A5E]">
                  {industry}
                </span>
              ) : null}
              {employeeCount ? (
                <span className="rounded-full border border-sky-100 bg-[#F5FAFD] px-3 py-1 text-xs font-medium text-[#2C4A5E]">
                  {employeeCount} ansatte
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-[#0D1F2D]">Teammedlemmer</h3>
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-sky-800">
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-sky-100 bg-white py-14 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-[#0A6EBD]">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-[#0D1F2D]">Dit team er tomt</p>
            {isOrgAdmin ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-sm font-semibold text-[#0A6EBD] hover:underline"
              >
                Inviter første kollega
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {members.map((member) => renderMemberCard(member))}
            {members.length === 1 && isOrgAdmin ? (
              <li className="w-[min(100%,220px)] shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-200 bg-[#FAFCFE] p-5 text-center transition hover:border-[#0A6EBD] hover:bg-sky-50/50"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-200 bg-white text-[#0A6EBD] shadow-sm">
                    <Plus className="h-7 w-7" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-[#0A6EBD]">Inviter dine kolleger</span>
                  <span className="text-xs text-[#7AAEC8]">Tilføj flere til teamet</span>
                </button>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );

  const renderIndstillinger = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Organisation"
        footer={
          <SaveButton visible={orgDirty} saving={savingOrg} onClick={() => void saveOrganisation()} />
        }
      >
        <div className="mb-4 flex items-center gap-4 border-b border-sky-50 pb-4">
          <button
            type="button"
            onClick={onOrgAvatarPick}
            disabled={uploadingOrgAvatar}
            aria-label="Skift organisationens logo"
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
          >
            <OrganisationLogo logoUrl={orgLogoUrl} initials={orgInitials} className="h-full w-full text-xl" />
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
          </button>
          <input
            ref={orgFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onOrgAvatarFileChange(e)}
          />
          <p className="text-sm text-[#7AAEC8]">Klik på logoet for at uploade et nyt</p>
        </div>

        <SettingsRow label="Virksomhedsnavn">
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={inputClass}
          />
        </SettingsRow>

        <SettingsRow label="Branche">
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
            <option value="">Vælg branche</option>
            {ORGANISATION_INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow label="Antal ansatte" last>
          <select
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            className={selectClass}
          >
            <option value="">Vælg størrelse</option>
            {ORGANISATION_EMPLOYEE_COUNT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Notifikationer for virksomheden"
        footer={
          <SaveButton
            visible={orgNotifDirty}
            saving={savingOrgNotif}
            onClick={() => void saveOrgNotifications()}
          />
        }
      >
        <SettingsRow label="Send notifikation til alle når et system fejler">
          <SettingsToggle
            checked={orgNotifPrefs.notify_all_system_failure}
            onChange={(v) => setOrgNotifPrefs((p) => ({ ...p, notify_all_system_failure: v }))}
          />
        </SettingsRow>
        <SettingsRow label="Send månedlig IT-rapport til alle teammedlemmer" last>
          <SettingsToggle
            checked={orgNotifPrefs.notify_all_monthly_report}
            onChange={(v) => setOrgNotifPrefs((p) => ({ ...p, notify_all_monthly_report: v }))}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );

  const renderInvitationer = () => (
    <SettingsSection title="Afventende invitationer">
      {pending.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#7AAEC8]">Ingen afventende invitationer.</p>
      ) : (
        <ul className="divide-y divide-sky-50">
          {pending.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0D1F2D]">{invite.email}</p>
                <p className="text-xs text-[#7AAEC8]">
                  {invite.role === "org_admin" ? "Administrator" : "Medlem"} · inviteret{" "}
                  {dateFmt.format(new Date(invite.created_at))}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={resendingId === invite.id}
                  onClick={() => void resendInvite(invite.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-[#0A6EBD] transition hover:bg-sky-50 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {resendingId === invite.id ? "Sender…" : "Send igen"}
                </button>
                <button
                  type="button"
                  onClick={() => void cancelInvite(invite.id)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Annuller
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );

  return (
    <>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F2D]">Team</h1>
            <p className="mt-1 text-sm text-[#7AAEC8]">Organisation og teammedlemmer</p>
          </div>
          {isOrgAdmin ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0]"
            >
              Inviter kollega
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-[#7AAEC8]">Indlæser team…</p>
        ) : (
          <>
            {isOrgAdmin ? (
              <SettingsTabs
                tabs={ADMIN_TABS}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as TeamTabId)}
                ariaLabel="Team sektioner"
              />
            ) : null}

            <div role="tabpanel" className={isOrgAdmin ? undefined : "mt-6"}>
              {(!isOrgAdmin || activeTab === "oversigt") && renderOversigt()}
              {isOrgAdmin && activeTab === "indstillinger" && renderIndstillinger()}
              {isOrgAdmin && activeTab === "invitationer" && renderInvitationer()}
            </div>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} titleId="invite-title">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0A6EBD]" />
          <h3 id="invite-title" className="text-lg font-semibold text-[#0D1F2D]">
            Inviter kollega
          </h3>
        </div>
        <form className="space-y-4" onSubmit={(e) => void handleInvite(e)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">E-mail</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A6EBD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#0D1F2D]">Rolle</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A6EBD]"
            >
              <option value="member">Medlem</option>
              <option value="org_admin">Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-4 py-2 text-sm text-[#2C4A5E] hover:bg-sky-50"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={savingInvite}
              className="rounded-full bg-[#0A6EBD] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0859A0] disabled:opacity-60"
            >
              {savingInvite ? "Sender…" : "Send invitation"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={removeTarget != null}
        onClose={() => !removing && setRemoveTarget(null)}
        titleId="remove-member-title"
      >
        <h3 id="remove-member-title" className="text-lg font-semibold text-[#0D1F2D]">
          Fjern teammedlem?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#2C4A5E]">
          {removeTarget?.full_name || removeTarget?.email} mister adgang til organisationens portal.
          Handlingen kan ikke fortrydes.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={removing}
            onClick={() => setRemoveTarget(null)}
            className="rounded-full px-4 py-2 text-sm text-[#2C4A5E] hover:bg-sky-50 disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={() => void confirmRemoveMember()}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {removing ? "Fjerner…" : "Fjern medlem"}
          </button>
        </div>
      </Modal>
    </>
  );
}
