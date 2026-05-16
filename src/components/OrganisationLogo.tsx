"use client";

import { useState } from "react";

type OrganisationLogoProps = {
  logoUrl?: string | null;
  initials: string;
  className?: string;
};

export function OrganisationLogo({
  logoUrl,
  initials,
  className = "h-20 w-20 text-2xl",
}: OrganisationLogoProps) {
  const [broken, setBroken] = useState(false);
  const url = logoUrl?.trim();

  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
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
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 font-bold text-white ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
