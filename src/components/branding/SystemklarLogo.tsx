import Link from "next/link";
import type { ReactNode } from "react";

type SystemklarLogoProps = {
  href?: string;
  label?: ReactNode;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
};

function LogoGlyph({
  className = "",
}: {
  className?: string;
}) {
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
