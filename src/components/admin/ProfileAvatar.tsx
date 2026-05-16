"use client";

import { useState } from "react";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  initials: string;
  /** Tailwind size classes for width/height, e.g. h-12 w-12 */
  className?: string;
  /** Background/text when showing initials */
  variant?: "sky" | "amber";
};

const variantClasses = {
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-800",
} as const;

export function ProfileAvatar({
  avatarUrl,
  initials,
  className = "h-12 w-12 text-sm",
  variant = "sky",
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const url = avatarUrl?.trim();

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        className={`shrink-0 rounded-full object-cover ${className}`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${variantClasses[variant]} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
