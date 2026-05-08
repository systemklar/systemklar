import Link from "next/link";
import type { ReactNode } from "react";

type SystemklarLogoProps = {
  href?: string;
  label?: ReactNode;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
  primaryFill?: string;
  secondaryFill?: string;
};

function LogoGlyph({
  className = "",
  primaryFill = "#0A6EBD",
  secondaryFill = "#4FA8E0",
}: {
  className?: string;
  primaryFill?: string;
  secondaryFill?: string;
}) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill={primaryFill} />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill={secondaryFill} />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill={secondaryFill} />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill={primaryFill} />
    </svg>
  );
}

export function SystemklarLogo({
  href,
  label = "systemklar",
  textClassName = "text-sm font-bold tracking-tight text-sky-600",
  className = "inline-flex items-center gap-2",
  iconClassName,
  primaryFill,
  secondaryFill,
}: SystemklarLogoProps) {
  const inner = (
    <span className={className}>
      <LogoGlyph className={iconClassName} primaryFill={primaryFill} secondaryFill={secondaryFill} />
      <span className={textClassName}>{label}</span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
