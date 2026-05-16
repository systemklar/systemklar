"use client";

import { useState, type CSSProperties } from "react";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  initials: string;
  /** Size + optional text/border utilities, e.g. `h-10 w-10 text-sm` or `h-9 w-9 border-2 border-white text-xs` */
  className?: string;
  variant?: "sky" | "amber" | "brand";
  style?: CSSProperties;
};

const variantClasses = {
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-800",
  brand: "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
} as const;

export function ProfileAvatar({
  avatarUrl,
  initials,
  className = "h-10 w-10 text-sm",
  variant = "sky",
  style,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const url = avatarUrl?.trim();
  const showImage = Boolean(url && !broken);

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={style}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img
          src={url}
          alt=""
          className="block h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-bold ${variantClasses[variant]}`}
          aria-hidden
        >
          {initials}
        </span>
      )}
    </span>
  );
}
