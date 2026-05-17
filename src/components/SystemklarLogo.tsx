import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const SIZES = {
  sm: { imgPx: 20, textPx: 13 },
  md: { imgPx: 28, textPx: 16 },
  lg: { imgPx: 36, textPx: 20 },
} as const;

const LOGO_SRC_WIDTH = 256;
const LOGO_SRC_HEIGHT = 256;

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
 * Lys baggrund: oliven logo + tekst #8B9E6B.
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
  const imgWidthAttr = Math.max(1, Math.round((imgPx * LOGO_SRC_WIDTH) / LOGO_SRC_HEIGHT));

  const imgStyle: CSSProperties = {
    display: "block",
    flexShrink: 0,
    height: imgPx,
    width: "auto",
    ...(isDark
      ? {
          filter: "brightness(0) invert(1)",
          WebkitFilter: "brightness(0) invert(1)",
        }
      : {
          filter: "sepia(1) saturate(2) hue-rotate(50deg) brightness(0.7)",
          WebkitFilter: "sepia(1) saturate(2) hue-rotate(50deg) brightness(0.7)",
        }),
  };

  const wrapClass = `inline-flex items-center font-bold lowercase tracking-tight ${className}`.trim();

  const mark: ReactNode = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- statisk brand-PNG */}
      <img
        src="/logo.png"
        alt=""
        width={imgWidthAttr}
        height={imgPx}
        style={imgStyle}
      />
      <span
        className={isDark ? "font-bold text-white" : "font-bold text-[#8B9E6B]"}
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
