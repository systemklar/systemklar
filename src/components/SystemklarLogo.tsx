import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const SIZES = {
  sm: { imgPx: 20, textPx: 13 },
  md: { imgPx: 28, textPx: 16 },
  lg: { imgPx: 36, textPx: 20 },
} as const;

export type SystemklarLogoVariant = "light" | "dark";
export type SystemklarLogoSize = keyof typeof SIZES;

export type SystemklarLogoProps = {
  variant?: SystemklarLogoVariant;
  size?: SystemklarLogoSize;
  href?: string;
  className?: string;
};

/**
 * Fælles logo: `/logo.png` + «systemklar» i Inter bold.
 * Lys baggrund: blå logo uden filter, tekst #0A6EBD.
 * Mørk/navy: hvid tekst + logo via filter.
 */
export function SystemklarLogo({
  variant = "light",
  size = "md",
  href,
  className = "",
}: SystemklarLogoProps) {
  const { imgPx, textPx } = SIZES[size];
  const isDark = variant === "dark";

  const imgStyle: CSSProperties = {
    height: imgPx,
    width: "auto",
    display: "block",
    ...(isDark ? { filter: "brightness(0) invert(1)" } : {}),
  };

  const wrapClass = `inline-flex items-center font-bold lowercase tracking-tight ${className}`.trim();

  const mark: ReactNode = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- statisk brand-PNG */}
      <img src="/logo.png" alt="" width={160} height={imgPx} style={imgStyle} />
      <span
        className={isDark ? "font-bold text-white" : "font-bold text-[#0A6EBD]"}
        style={{ fontSize: textPx, lineHeight: 1.1 }}
      >
        systemklar
      </span>
    </>
  );

  if (!href) {
    return (
      <span className={wrapClass} style={{ gap: 8 }}>
        {mark}
      </span>
    );
  }

  return (
    <Link href={href} className={`${wrapClass} no-underline`.trim()} style={{ gap: 8 }}>
      {mark}
    </Link>
  );
}
