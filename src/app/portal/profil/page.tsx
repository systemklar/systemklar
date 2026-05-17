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
import Link from "next/link";
import { Camera, Loader2 } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ComingSoonBadge } from "@/components/portal/settings/ComingSoonBadge";
import { SaveButton } from "@/components/portal/settings/SaveButton";
import { SettingsRow } from "@/components/portal/settings/SettingsRow";
import { SettingsSection } from "@/components/portal/settings/SettingsSection";
import { SettingsTabs, type SettingsTabItem } from "@/components/portal/settings/SettingsTabs";
import { SettingsToggle } from "@/components/portal/settings/SettingsToggle";
import { Modal } from "@/components/ui/Modal";
import {
  profileNotificationPreferencesToJson,
  resolveProfileNotificationPreferences,
  type ProfileNotificationPreferences,
} from "@/lib/notification-preferences";
import { createClient } from "@/lib/supabase";
import {
  notifyPortalProfileAvatarUpdated,
  publicAvatarUrl,
  withCacheBust,
} from "@/lib/storage-public-urls";

type ProfileTabId = "profil" | "sikkerhed" | "notifikationer";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_initials: string | null;
  avatar_url: string | null;
  notification_preferences: unknown;
  notif_new_message: boolean | null;
  notif_status_change: boolean | null;
  notif_monthly_report: boolean | null;
};

const PROFILE_TABS: SettingsTabItem[] = [
  { id: "profil", label: "Min profil" },
  { id: "sikkerhed", label: "Sikkerhed" },
  { id: "notifikationer", label: "Notifikationer" },
];

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const inputClass =
  "w-full max-w-xs rounded-xl border border-[#D4C9A8] px-3 py-2 text-sm text-[#2C3020] outline-none focus:ring-2 focus:ring-[#8B9E6B] sm:text-right";

export default function PortalProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabId>("profil");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savedFullName, setSavedFullName] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<ProfileNotificationPreferences>({
    ticket_updated: true,
    system_failure: true,
    report_ready: true,
    weekly_status: false,
  });
  const [savedNotifPrefs, setSavedNotifPrefs] = useState<ProfileNotificationPreferences>(notifPrefs);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const profileDirty =
    fullName.trim() !== savedFullName.trim() || phone.trim() !== savedPhone.trim();
  const passwordDirty =
    currentPassword.length > 0 || newPassword.length > 0 || confirmNewPassword.length > 0;
  const notifDirty = JSON.stringify(notifPrefs) !== JSON.stringify(savedNotifPrefs);

  const refreshAvatarUrl = useCallback(
    (uid: string) => {
      const { data } = supabase.storage.from("avatars").getPublicUrl(uid);
      setAvatarUrl(withCacheBust(data.publicUrl));
    },
    [supabase],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Du er ikke logget ind. Log venligst ind igen.");
      setProfile(null);
      setLoading(false);
      return;
    }

    const authUser = authData.user;
    setAuthUserId(authUser.id);
    setAuthEmail(authUser.email ?? null);

    const columns =
      "id,full_name,email,phone,avatar_initials,avatar_url,notification_preferences,notif_new_message,notif_status_change,notif_monthly_report";

    const { data: byIdData, error: profileError } = await supabase
      .from("profiles")
      .select(columns)
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      setError(`Kunne ikke hente profil: ${profileError.message}`);
      setLoading(false);
      return;
    }

    let profileRow = (Array.isArray(byIdData) ? byIdData[0] : byIdData) as ProfileRow | null;

    if (!profileRow) {
      const { data: byUserIdData } = await supabase
        .from("profiles")
        .select(columns)
        .eq("user_id", authUser.id)
        .maybeSingle();
      profileRow = (Array.isArray(byUserIdData) ? byUserIdData[0] : byUserIdData) as ProfileRow | null;
    }

    if (!profileRow) {
      setError("Din profil blev ikke fundet. Kontakt support på kontakt@systemklar.dk.");
      setLoading(false);
      return;
    }

    const prefs = resolveProfileNotificationPreferences(profileRow.notification_preferences, {
      notif_new_message: profileRow.notif_new_message,
      notif_status_change: profileRow.notif_status_change,
      notif_monthly_report: profileRow.notif_monthly_report,
    });

    const name = profileRow.full_name ?? "";
    const phoneVal = profileRow.phone ?? "";

    setProfile(profileRow);
    setFullName(name);
    setSavedFullName(name);
    setPhone(phoneVal);
    setSavedPhone(phoneVal);
    setNotifPrefs(prefs);
    setSavedNotifPrefs(prefs);

    const storedAvatar = profileRow.avatar_url?.trim();
    if (storedAvatar) {
      setAvatarUrl(withCacheBust(storedAvatar));
    } else {
      refreshAvatarUrl(authUser.id);
    }

    setLoading(false);
  }, [supabase, refreshAvatarUrl]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onAvatarPick = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authUserId) return;
    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(authUserId, file, { upsert: true, contentType: file.type || "image/png" });

    setUploadingAvatar(false);
    if (upErr) {
      setError(`Kunne ikke uploade billede: ${upErr.message}`);
      event.target.value = "";
      return;
    }

    const publicUrl = publicAvatarUrl(authUserId);
    const { error: avatarColErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", authUserId);

    if (avatarColErr) {
      setError(`Billedet blev uploadet, men kunne ikke gemmes: ${avatarColErr.message}`);
      event.target.value = "";
      return;
    }

    setAvatarUrl(withCacheBust(publicUrl));
    setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    notifyPortalProfileAvatarUpdated();
    setSuccess("Profilbillede er opdateret.");
    event.target.value = "";
  };

  const saveProfileFields = async () => {
    if (!profile) return;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setError("Navn skal være mindst 2 tegn.");
      return;
    }
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmed,
        avatar_initials: buildInitials(trimmed),
        phone: phone.trim() || null,
      })
      .eq("id", profile.id);

    setSavingProfile(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedFullName(trimmed);
    setSavedPhone(phone.trim());
    setSuccess("Profil er opdateret.");
    await loadProfile();
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!currentPassword.trim()) {
      setError("Indtast nuværende adgangskode.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Ny adgangskode skal være mindst 8 tegn.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("De nye adgangskoder matcher ikke.");
      return;
    }

    setSavingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSuccess("Adgangskoden er opdateret.");
  };

  const saveNotifications = async () => {
    if (!profile) return;
    setSavingNotifications(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        notification_preferences: profileNotificationPreferencesToJson(notifPrefs),
      })
      .eq("id", profile.id);

    setSavingNotifications(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedNotifPrefs(notifPrefs);
    setSuccess("Notifikationsindstillinger er gemt.");
  };

  const avatarText =
    profile?.avatar_initials || buildInitials(profile?.full_name ?? "") || "??";
  const displayEmail = profile?.email || authEmail || "—";

  if (!profile && !loading) {
    return (
      <div className="w-full p-6 text-center md:p-8">
        <h1 className="mb-3 text-xl font-bold text-[#2C3020]">Kunne ikke hente profil</h1>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Der opstod en ukendt fejl."}
        </p>
      </div>
    );
  }

  const renderProfil = () => (
    <SettingsSection
      footer={
        <SaveButton
          visible={profileDirty}
          saving={savingProfile}
          onClick={() => void saveProfileFields()}
        />
      }
    >
      <div className="mb-4 flex items-center gap-4 border-b border-[#E8E2D0] pb-4">
        <button
          type="button"
          onClick={onAvatarPick}
          disabled={uploadingAvatar}
          aria-label="Skift profilbillede"
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B9E6B]"
        >
          <ProfileAvatar
            avatarUrl={avatarUrl ?? profile?.avatar_url}
            initials={avatarText}
            className="h-full w-full text-xl"
            variant="brand"
          />
          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition ${
              uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {uploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onAvatarFileChange(e)}
        />
        <p className="text-sm text-[#8C8A78]">Klik på billedet for at uploade et nyt profilbillede</p>
      </div>

      <SettingsRow label="Fuldt navn">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Dit navn"
        />
      </SettingsRow>

      <SettingsRow label="Email" description="Kontakt os for at ændre din email">
        <span className="text-sm text-[#5C5A48]">{displayEmail}</span>
      </SettingsRow>

      <SettingsRow label="Telefonnummer" last>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="Valgfrit"
        />
      </SettingsRow>
    </SettingsSection>
  );

  const renderSikkerhed = () => (
    <SettingsSection title="Sikkerhed">
      <form onSubmit={(e) => void savePassword(e)}>
        <SettingsRow label="Nuværende adgangskode">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </SettingsRow>
        <SettingsRow label="Ny adgangskode">
          <input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </SettingsRow>
        <SettingsRow label="Bekræft ny adgangskode" last>
          <input
            type="password"
            minLength={8}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </SettingsRow>
        {passwordDirty ? (
          <div className="mt-4 flex justify-end border-t border-[#E8E2D0] pt-4">
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-full bg-[#8B9E6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7A8A5A] disabled:opacity-60"
            >
              {savingPassword ? "Gemmer…" : "Gem adgangskode"}
            </button>
          </div>
        ) : null}
      </form>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#E8E2D0] pt-4">
        <div>
          <p className="text-sm font-medium text-[#2C3020]">To-faktor godkendelse</p>
          <div className="mt-1 flex items-center gap-2">
            <ComingSoonBadge />
          </div>
        </div>
        <SettingsToggle checked={false} onChange={() => {}} disabled />
      </div>
    </SettingsSection>
  );

  const renderNotifikationer = () => (
    <SettingsSection
      title="Notifikationer"
      footer={
        <SaveButton
          visible={notifDirty}
          saving={savingNotifications}
          onClick={() => void saveNotifications()}
        />
      }
    >
      <SettingsRow label="Send mig email når en IT-sag opdateres">
        <SettingsToggle
          checked={notifPrefs.ticket_updated}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, ticket_updated: v }))}
        />
      </SettingsRow>
      <SettingsRow label="Send mig email når et system fejler">
        <SettingsToggle
          checked={notifPrefs.system_failure}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, system_failure: v }))}
        />
      </SettingsRow>
      <SettingsRow label="Send mig email når en IT-rapport er klar">
        <SettingsToggle
          checked={notifPrefs.report_ready}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, report_ready: v }))}
        />
      </SettingsRow>
      <SettingsRow label="Send mig ugentligt overblik over systemstatus" last>
        <SettingsToggle
          checked={notifPrefs.weekly_status}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, weekly_status: v }))}
        />
      </SettingsRow>
    </SettingsSection>
  );

  return (
    <div className="w-full p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#2C3020]">Profil</h1>
        <p className="mt-1 text-sm text-[#8C8A78]">Personlige indstillinger og sikkerhed</p>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      ) : null}

      {loading || !profile ? (
        <p className="mt-6 text-sm text-[#8C8A78]">Indlæser profil…</p>
      ) : (
        <>
          <SettingsTabs
            tabs={PROFILE_TABS}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as ProfileTabId)}
            ariaLabel="Profil sektioner"
          />

          <div role="tabpanel">
            {activeTab === "profil" && renderProfil()}
            {activeTab === "sikkerhed" && renderSikkerhed()}
            {activeTab === "notifikationer" && renderNotifikationer()}
          </div>

          <p className="mt-10 text-center text-sm">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="text-[#8C8A78] underline-offset-2 hover:text-[#5C5A48] hover:underline"
            >
              Privatliv
            </button>
          </p>
        </>
      )}

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} titleId="delete-account-title">
        <h3 id="delete-account-title" className="text-lg font-semibold text-[#2C3020]">
          Slet min konto?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5A48]">
          Dette vil permanent fjerne din adgang til portalen og alle tilknyttede data. Handlingen kan
          ikke fortrydes. Kontakt os på{" "}
          <Link href="mailto:kontakt@systemklar.dk" className="text-[#8B9E6B] hover:underline">
            kontakt@systemklar.dk
          </Link>{" "}
          hvis du ønsker at slette din konto.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#5C5A48] hover:bg-[#EEF2E6]"
          >
            Luk
          </button>
        </div>
      </Modal>
    </div>
  );
}
