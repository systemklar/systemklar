"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { withCacheBust } from "@/lib/storage-public-urls";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  initials: string;
  /** Box size (h/w), text size, borders — e.g. `h-10 w-10 text-sm border-2 border-white` */
  className?: string;
  variant?: "sky" | "amber" | "brand";
  style?: CSSProperties;
  /** When true, append `?t=` for display (use after upload). */
  cacheBust?: boolean;
};

const variantClasses = {
  sky: "bg-[#EEF2E6] text-[#7A8A5A]",
  amber: "bg-amber-100 text-amber-800",
  brand: "bg-gradient-to-br from-[#8B9E6B] to-[#7A8A5A] text-white",
} as const;

function splitAvatarClasses(className: string) {
  const parts = className.trim().split(/\s+/).filter(Boolean);
  const box: string[] = [];
  const text: string[] = [];
  const extra: string[] = [];

  for (const part of parts) {
    if (/^(h-|w-|size-|min-h-|min-w-|max-h-|max-w-)/.test(part)) {
      box.push(part);
    } else if (/^text-/.test(part)) {
      text.push(part);
    } else {
      extra.push(part);
    }
  }

  if (!box.some((p) => p.startsWith("h-"))) box.push("h-10");
  if (!box.some((p) => p.startsWith("w-"))) box.push("w-10");
  if (text.length === 0) text.push("text-sm");

  return {
    box: box.join(" "),
    text: text.join(" "),
    extra: extra.join(" "),
  };
}

export function ProfileAvatar({
  avatarUrl,
  initials,
  className = "h-10 w-10 text-sm",
  variant = "sky",
  style,
  cacheBust = false,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const { box, text, extra } = useMemo(() => splitAvatarClasses(className), [className]);

  const rawUrl = avatarUrl?.trim() ?? "";
  const displayUrl = useMemo(() => {
    if (!rawUrl) return "";
    return cacheBust ? withCacheBust(rawUrl) : rawUrl;
  }, [rawUrl, cacheBust]);

  useEffect(() => {
    setBroken(false);
  }, [displayUrl]);

  const showImage = Boolean(displayUrl && !broken);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${box} ${extra}`.trim()}
      style={style}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img
          key={displayUrl}
          src={displayUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-bold ${text} ${variantClasses[variant]}`}
          aria-hidden
        >
          {initials}
        </div>
      )}
    </div>
  );
}
