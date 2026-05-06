import Link from "next/link";
import type { ReactNode } from "react";

type SystemklarLogoProps = {
  href?: string;
  label?: ReactNode;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
};

function LogoGlyph({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#0A6EBD" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#4FA8E0" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#4FA8E0" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#0A6EBD" />
    </svg>
  );
}

export function SystemklarLogo({
  href,
  label = "systemklar",
  textClassName = "text-sm font-bold tracking-tight text-sky-600",
  className = "inline-flex items-center gap-2",
  iconClassName,
}: SystemklarLogoProps) {
  const inner = (
    <span className={className}>
      <LogoGlyph className={iconClassName} />
      <span className={textClassName}>{label}</span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
