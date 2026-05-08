import Link from "next/link";
import type { ReactNode } from "react";

export type SystemklarLogoVariant = "light" | "dark";

type SystemklarLogoProps = {
  href?: string;
  label?: ReactNode;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
  variant?: SystemklarLogoVariant;
};

// Tailwind kan kun ramme #0A6EBD via vilkårlige `[filter:...]`-klasser, så
// den lyse variant nedenfor er en hex-eksakt blå filtrering af et sort PNG.
const LIGHT_ICON_CLASS =
  "brightness-0 saturate-100 [filter:invert(29%)_sepia(98%)_saturate(1000%)_hue-rotate(185deg)_brightness(89%)_contrast(101%)]";
const DARK_ICON_CLASS = "brightness-0 invert";

function LogoGlyph({ className = LIGHT_ICON_CLASS }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      className={`h-5 w-5 shrink-0 object-contain ${className}`.trim()}
      aria-hidden
    />
  );
}

export function SystemklarLogo({
  href,
  label = "systemklar",
  textClassName = "text-sm font-bold tracking-tight text-sky-700",
  className = "inline-flex items-center gap-2",
  iconClassName,
  variant = "light",
}: SystemklarLogoProps) {
  const resolvedIconClassName =
    iconClassName ?? (variant === "dark" ? DARK_ICON_CLASS : LIGHT_ICON_CLASS);

  const inner = (
    <span className={className}>
      <LogoGlyph className={resolvedIconClassName} />
      <span className={textClassName}>{label}</span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
