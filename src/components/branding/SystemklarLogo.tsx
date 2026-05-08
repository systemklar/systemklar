import Link from "next/link";
import type { ReactNode } from "react";

type SystemklarLogoProps = {
  href?: string;
  label?: ReactNode;
  textClassName?: string;
  className?: string;
  iconClassName?: string;
};

/**
 * Inline SVG-version af SK-logoet. Bruger sky-600-paletten — #0A6EBD til
 * det mørke S og #4FA8E0 til det lyse K. Inline SVG sikrer at logoet aldrig
 * fremstår gråt/farveløst og kan farveskiftes via filter-klasser
 * (`brightness-0 invert` på mørk baggrund) ligesom det gamle ikon.
 */
function LogoGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <text
        x="1"
        y="19"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="20"
        letterSpacing="-1"
        fill="#0A6EBD"
      >
        S
      </text>
      <text
        x="12"
        y="19"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="20"
        letterSpacing="-1"
        fill="#4FA8E0"
      >
        K
      </text>
    </svg>
  );
}

export function SystemklarLogo({
  href,
  label = "systemklar",
  textClassName = "text-sm font-semibold tracking-tight text-sky-600",
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
