"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { OrganisationLogo } from "@/components/OrganisationLogo";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { notifyPortalProfileAvatarUpdated } from "@/lib/storage-public-urls";
import { uploadOrganisationLogo, uploadProfileAvatar } from "@/lib/portal-media-upload";
import type { SupabaseClient } from "@supabase/supabase-js";

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type OnboardingPhotoUploadsProps = {
  supabase: SupabaseClient;
  profileId: string;
  fullName: string | null;
  avatarInitials: string | null;
  initialAvatarUrl: string | null;
  organisationId: string | null;
  organisationName: string | null;
  isOrgAdmin: boolean;
  initialLogoUrl: string | null;
  onSkip: () => void;
  /** Større, centreret UI til profil-trinnet i onboarding. */
  variant?: "compact" | "profile-step";
};

function UploadSuccessBadge() {
  return (
    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#22C78A] text-white shadow-sm">
      <CheckCircle2 className="h-4 w-4" aria-hidden />
      <span className="sr-only">Uploadet</span>
    </span>
  );
}

export function OnboardingPhotoUploads({
  supabase,
  profileId,
  fullName,
  avatarInitials,
  initialAvatarUrl,
  organisationId,
  organisationName,
  isOrgAdmin,
  initialLogoUrl,
  onSkip,
  variant = "compact",
}: OnboardingPhotoUploadsProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [avatarUploaded, setAvatarUploaded] = useState(Boolean(initialAvatarUrl));
  const [logoUploaded, setLogoUploaded] = useState(Boolean(initialLogoUrl));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const profileInitials =
    avatarInitials?.trim().slice(0, 2).toUpperCase() ||
    buildInitials(fullName || "U") ||
    "??";
  const orgInitials = buildInitials(organisationName || "V");

  const isProfileStep = variant === "profile-step";
  const avatarSize = isProfileStep ? "h-32 w-32" : "h-16 w-16";
  const logoSize = isProfileStep ? "h-28 w-28 rounded-2xl" : "h-16 w-16 rounded-full";

  const onAvatarPick = () => {
    if (uploadingAvatar) return;
    avatarInputRef.current?.click();
  };

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setUploadError(null);

    const result = await uploadProfileAvatar(supabase, profileId, file);
    setUploadingAvatar(false);
    event.target.value = "";

    if (!result.ok) {
      setUploadError(result.error);
      return;
    }

    setAvatarUrl(result.displayUrl);
    setAvatarUploaded(true);
    notifyPortalProfileAvatarUpdated();
  };

  const onLogoPick = () => {
    if (!organisationId || !isOrgAdmin || uploadingLogo) return;
    logoInputRef.current?.click();
  };

  const onLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organisationId) return;
    setUploadingLogo(true);
    setUploadError(null);

    const result = await uploadOrganisationLogo(supabase, organisationId, file);
    setUploadingLogo(false);
    event.target.value = "";

    if (!result.ok) {
      setUploadError(result.error);
      return;
    }

    setLogoUrl(result.displayUrl);
    setLogoUploaded(true);
  };

  const showOrgLogo = Boolean(organisationId && isOrgAdmin);

  const avatarButton = (
    <button
      type="button"
      onClick={onAvatarPick}
      disabled={uploadingAvatar}
      aria-label="Upload profilbillede"
      className={`group relative ${avatarSize} overflow-hidden rounded-full border-2 border-dashed border-[#CBD5E8] bg-[#E8EEFC]/50 p-0 transition hover:border-[#CBD5E8] hover:bg-[#E8EEFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2952A3] disabled:cursor-not-allowed`}
    >
      <ProfileAvatar
        avatarUrl={avatarUrl}
        initials={profileInitials}
        className="h-full w-full text-2xl"
        variant="brand"
      />
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#0A1628]/45 text-white transition ${
          uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } ${avatarUrl && !uploadingAvatar ? "group-hover:opacity-90" : ""}`}
      >
        {uploadingAvatar ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <>
            <Camera className={isProfileStep ? "h-7 w-7" : "h-4 w-4"} aria-hidden />
            {isProfileStep ? (
              <span className="px-2 text-center text-[10px] font-semibold leading-tight">
                Klik for at uploade
              </span>
            ) : null}
          </>
        )}
      </span>
      {avatarUploaded && !uploadingAvatar ? <UploadSuccessBadge /> : null}
    </button>
  );

  const logoButton = showOrgLogo ? (
    <button
      type="button"
      onClick={onLogoPick}
      disabled={uploadingLogo}
      aria-label="Upload virksomhedslogo"
      className={`group relative ${logoSize} overflow-hidden border-2 border-dashed border-[#CBD5E8] bg-[#E8EEFC]/50 p-0 transition hover:border-[#CBD5E8] hover:bg-[#E8EEFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2952A3] disabled:cursor-not-allowed`}
    >
      <OrganisationLogo logoUrl={logoUrl} initials={orgInitials} className="h-full w-full text-xl" />
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#0A1628]/45 text-white transition ${
          uploadingLogo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploadingLogo ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <>
            <Camera className={isProfileStep ? "h-6 w-6" : "h-4 w-4"} aria-hidden />
            {isProfileStep ? (
              <span className="px-2 text-center text-[10px] font-semibold leading-tight">
                Klik for at uploade
              </span>
            ) : null}
          </>
        )}
      </span>
      {logoUploaded && !uploadingLogo ? <UploadSuccessBadge /> : null}
    </button>
  ) : null;

  if (isProfileStep) {
    return (
      <div className="mt-8 space-y-10">
        <div className="flex flex-col items-center gap-3">
          {avatarButton}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onAvatarChange(e)}
          />
          <p className="text-sm font-semibold text-[#0A1628]">Dit profilbillede</p>
        </div>

        {showOrgLogo ? (
          <div className="flex flex-col items-center gap-3">
            {logoButton}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onLogoChange(e)}
            />
            <p className="text-sm font-semibold text-[#0A1628]">Jeres virksomhedslogo</p>
          </div>
        ) : null}

        {uploadError ? (
          <p className="text-center text-sm text-red-600">{uploadError}</p>
        ) : null}

        <p className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-[#2A4868] underline-offset-2 hover:text-[#1E4490] hover:underline"
          >
            Spring over
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div
        className={`flex flex-wrap items-start justify-center gap-8 ${showOrgLogo ? "" : "gap-0"}`}
      >
        <div className="flex flex-col items-center gap-2">
          {avatarButton}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onAvatarChange(e)}
          />
          <span className="text-center text-xs font-medium text-[#2A4868]">Upload profilbillede</span>
        </div>

        {showOrgLogo ? (
          <div className="flex flex-col items-center gap-2">
            {logoButton}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onLogoChange(e)}
            />
            <span className="text-center text-xs font-medium text-[#2A4868]">Upload virksomhedslogo</span>
          </div>
        ) : null}
      </div>

      {uploadError ? (
        <p className="mt-3 text-center text-xs text-red-600">{uploadError}</p>
      ) : null}

      <p className="mt-4 text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-[#2A4868] underline-offset-2 hover:text-[#1E4490] hover:underline"
        >
          Spring over
        </button>
      </p>
    </div>
  );
}
