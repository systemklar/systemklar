"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { withCacheBust } from "@/lib/storage-public-urls";

type OrganisationLogoProps = {
  logoUrl?: string | null;
  initials: string;
  className?: string;
  style?: CSSProperties;
  cacheBust?: boolean;
};

function splitLogoClasses(className: string) {
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

  if (!box.some((p) => p.startsWith("h-"))) box.push("h-20");
  if (!box.some((p) => p.startsWith("w-"))) box.push("w-20");
  if (text.length === 0) text.push("text-2xl");

  return {
    box: box.join(" "),
    text: text.join(" "),
    extra: extra.join(" "),
  };
}

export function OrganisationLogo({
  logoUrl,
  initials,
  className = "h-20 w-20 text-2xl",
  style,
  cacheBust = false,
}: OrganisationLogoProps) {
  const [broken, setBroken] = useState(false);
  const { box, text, extra } = useMemo(() => splitLogoClasses(className), [className]);

  const rawUrl = logoUrl?.trim() ?? "";
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
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400 to-sky-600 font-bold text-white ${text}`}
          aria-hidden
        >
          {initials}
        </div>
      )}
    </div>
  );
}
