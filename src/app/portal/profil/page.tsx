"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { createClient } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_initials: string | null;
  role: string | null;
  notif_new_message: boolean | null;
  notif_status_change: boolean | null;
  notif_monthly_report: boolean | null;
  organisations: { name: string } | { name: string }[] | null;
};

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
        value ? "bg-sky-600" : "bg-slate-200"
      }`}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function PortalProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const session = usePortalSession();
  const userId = session?.userId ?? null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifNewMessage, setNotifNewMessage] = useState(true);
  const [notifStatusChange, setNotifStatusChange] = useState(true);
  const [notifMonthlyReport, setNotifMonthlyReport] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[portal/profil] auth.getUser fejlede", authError);
      setError("Kunne ikke hente brugersession. Prøv at logge ud og ind igen.");
      setProfile(null);
      setLoading(false);
      return;
    }
    const authUser = authData.user;
    if (!authUser) {
      console.error("[portal/profil] ingen authenticated user fundet");
      setError("Du er ikke logget ind. Log venligst ind igen.");
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id,full_name,email,avatar_initials,role,notif_new_message,notif_status_change,notif_monthly_report,organisations(name)"
      )
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("[portal/profil] profiles.select fejlede", profileError);
      setError(`Kunne ikke hente profil: ${profileError.message}`);
      setProfile(null);
      setLoading(false);
      return;
    }
    const profileRow = (Array.isArray(data) ? data[0] : data) as ProfileRow | null | undefined;
    if (!profileRow) {
      console.error("[portal/profil] profil ikke fundet for user", authUser.id);
      setError("Din profil blev ikke fundet i databasen. Kontakt support på kontakt@systemklar.dk.");
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(profileRow);
    setFullNameInput(profileRow.full_name ?? "");
    setNotifNewMessage(profileRow.notif_new_message ?? true);
    setNotifStatusChange(profileRow.notif_status_change ?? true);
    setNotifMonthlyReport(profileRow.notif_monthly_report ?? true);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    void loadProfile();
  }, [userId, loadProfile]);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    const trimmed = fullNameInput.trim();
    if (trimmed.length < 2) {
      setError("Navn skal være mindst 2 tegn.");
      setSuccess(null);
      return;
    }
    setSavingName(true);
    setError(null);
    setSuccess(null);
    const initials = buildInitials(trimmed);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmed,
        avatar_initials: initials,
      })
      .eq("id", profile.id);

    setSavingName(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditingName(false);
    setSuccess("Navn er opdateret.");
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
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
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
        notif_new_message: notifNewMessage,
        notif_status_change: notifStatusChange,
        notif_monthly_report: notifMonthlyReport,
      })
      .eq("id", profile.id);
    setSavingNotifications(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess("Notifikationsindstillinger er gemt.");
    await loadProfile();
  };

  const roleLabel = profile?.role === "org_admin" ? "Administrator" : "Medlem";
  const organisationName = Array.isArray(profile?.organisations)
    ? profile.organisations[0]?.name ?? "Ukendt organisation"
    : profile?.organisations?.name ?? "Ukendt organisation";
  const avatarText = profile?.avatar_initials || buildInitials(profile?.full_name ?? "") || "??";

  if (!profile && !loading) {
    return (
      <PortalLayout activeNav="profile">
        <div className="mx-auto max-w-xl p-8 text-center">
          <h1 className="mb-3 text-xl font-bold text-[#0D1F2D]">Kunne ikke hente profil</h1>
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Der opstod en ukendt fejl. Prøv at logge ud og ind igen."}
          </p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout activeNav="profile">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#0D1F2D]">Profil</h1>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

        {loading || !profile ? (
          <p className="text-sm text-[#4A8CB5]">Indlæser profil...</p>
        ) : (
          <>
            <section className="mb-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b border-sky-50 pb-3 text-base font-semibold text-[#0D1F2D]">Min profil</h2>
              <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-2xl font-bold text-white">
                    {avatarText}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0D1F2D]">{profile.full_name || "Ukendt navn"}</p>
                    <p className="text-sm text-[#4A8CB5]">{profile.email || session?.email || "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          profile.role === "org_admin"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {roleLabel}
                      </span>
                      <span className="text-sm text-[#2C4A5E]">{organisationName}</span>
                    </div>
                  </div>
                </div>

                {!editingName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFullNameInput(profile.full_name ?? "");
                      setEditingName(true);
                    }}
                    className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    Rediger navn
                  </button>
                ) : null}
              </div>

              {editingName ? (
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => void saveName(e)}>
                  <div className="w-full sm:max-w-md">
                    <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                      Fuldt navn
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      Annuller
                    </button>
                    <button
                      type="submit"
                      disabled={savingName}
                      className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      {savingName ? "Gemmer..." : "Gem"}
                    </button>
                  </div>
                </form>
              ) : null}
            </section>

            <section className="mb-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b border-sky-50 pb-3 text-base font-semibold text-[#0D1F2D]">Skift adgangskode</h2>
              <form className="mt-4 grid grid-cols-1 gap-4 md:max-w-xl" onSubmit={(e) => void savePassword(e)}>
                <div>
                  <label htmlFor="current_password" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                    Nuværende adgangskode
                  </label>
                  <input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new_password" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                    Ny adgangskode
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirm_new_password" className="mb-1 block text-sm font-medium text-[#0D1F2D]">
                    Bekraeft ny adgangskode
                  </label>
                  <input
                    id="confirm_new_password"
                    type="password"
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-500 md:text-sm"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {savingPassword ? "Gemmer..." : "Gem"}
                  </button>
                </div>
              </form>
            </section>

            <section className="mb-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b border-sky-50 pb-3 text-base font-semibold text-[#0D1F2D]">Notifikationer</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#2C4A5E]">Email ved ny besked i supportssag</p>
                  <Toggle value={notifNewMessage} onChange={setNotifNewMessage} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#2C4A5E]">Email nar sag skifter status</p>
                  <Toggle value={notifStatusChange} onChange={setNotifStatusChange} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#2C4A5E]">Manedlig IT-rapport notifikation</p>
                  <Toggle value={notifMonthlyReport} onChange={setNotifMonthlyReport} />
                </div>
                <div>
                  <button
                    type="button"
                    disabled={savingNotifications}
                    onClick={() => void saveNotifications()}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {savingNotifications ? "Gemmer..." : "Gem notifikationer"}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
