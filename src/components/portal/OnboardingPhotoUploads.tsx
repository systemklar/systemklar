"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
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
};

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
}: OnboardingPhotoUploadsProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const profileInitials =
    avatarInitials?.trim().slice(0, 2).toUpperCase() ||
    buildInitials(fullName || "U") ||
    "??";
  const orgInitials = buildInitials(organisationName || "V");

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
  };

  const showOrgLogo = Boolean(organisationId && isOrgAdmin);

  return (
    <div className="mt-6">
      <div
        className={`flex flex-wrap items-start justify-center gap-8 ${showOrgLogo ? "" : "gap-0"}`}
      >
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onAvatarPick}
            disabled={uploadingAvatar}
            aria-label="Upload profilbillede"
            className="group relative h-16 w-16 overflow-hidden rounded-full p-0 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed"
          >
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={profileInitials}
              className="h-full w-full text-lg"
              variant="brand"
            />
            <span
              className={`absolute inset-0 flex items-center justify-center bg-black/35 transition ${
                uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
              ) : (
                <Camera className="h-4 w-4 text-white" aria-hidden />
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onAvatarChange(e)}
          />
          <span className="text-center text-xs font-medium text-[#4A8CB5]">Upload profilbillede</span>
        </div>

        {showOrgLogo ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onLogoPick}
              disabled={uploadingLogo}
              aria-label="Upload virksomhedslogo"
              className="group relative h-16 w-16 overflow-hidden rounded-full p-0 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed"
            >
              <OrganisationLogo
                logoUrl={logoUrl}
                initials={orgInitials}
                className="h-full w-full text-lg"
              />
              <span
                className={`absolute inset-0 flex items-center justify-center bg-black/35 transition ${
                  uploadingLogo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                ) : (
                  <Camera className="h-4 w-4 text-white" aria-hidden />
                )}
              </span>
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onLogoChange(e)}
            />
            <span className="text-center text-xs font-medium text-[#4A8CB5]">Upload virksomhedslogo</span>
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
          className="text-sm font-medium text-[#4A8CB5] underline-offset-2 hover:text-sky-700 hover:underline"
        >
          Spring over
        </button>
      </p>
    </div>
  );
}
