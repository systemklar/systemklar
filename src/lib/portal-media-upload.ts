import type { SupabaseClient } from "@supabase/supabase-js";
import { publicAvatarUrl, publicOrganisationLogoUrl, withCacheBust } from "@/lib/storage-public-urls";

type UploadOk = { ok: true; publicUrl: string; displayUrl: string };
type UploadErr = { ok: false; error: string };

export async function uploadProfileAvatar(
  supabase: SupabaseClient,
  profileId: string,
  file: File,
): Promise<UploadOk | UploadErr> {
  const { error: upErr } = await supabase.storage.from("avatars").upload(profileId, file, {
    upsert: true,
    contentType: file.type || "image/png",
  });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const publicUrl = publicAvatarUrl(profileId);
  const { error: colErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", profileId);

  if (colErr) {
    return { ok: false, error: colErr.message };
  }

  return { ok: true, publicUrl, displayUrl: withCacheBust(publicUrl) };
}

export async function uploadOrganisationLogo(
  supabase: SupabaseClient,
  organisationId: string,
  file: File,
): Promise<UploadOk | UploadErr> {
  const { error: upErr } = await supabase.storage
    .from("organisation-avatars")
    .upload(organisationId, file, {
      upsert: true,
      contentType: file.type || "image/png",
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const publicUrl = publicOrganisationLogoUrl(organisationId);
  const { error: colErr } = await supabase
    .from("organisations")
    .update({ logo_url: publicUrl })
    .eq("id", organisationId);

  if (colErr) {
    return { ok: false, error: colErr.message };
  }

  return { ok: true, publicUrl, displayUrl: withCacheBust(publicUrl) };
}
