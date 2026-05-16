import Link from "next/link";
import type { ReactNode } from "react";

export type SystemklarLogoVariant = "light" | "dark";

type SystemklarLogoProps = {
  href?: string;
  /** @deprecated Bruges ikke — wordmark er altid «systemklar». */
  label?: ReactNode;
  /** Ekstra Tailwind-klasser på wordmark (fx størrelse). */
  textClassName?: string;
  className?: string;
  variant?: SystemklarLogoVariant;
};

function LogoDot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} aria-hidden />;
}

/**
 * Tekst-wordmark: altid lowercase «systemklar», Inter bold.
 * Lys baggrund: #0A6EBD · Mørk/navy: hvid.
 */
export function SystemklarLogo({
  href,
  textClassName = "",
  className = "inline-flex items-center gap-2",
  variant = "light",
}: SystemklarLogoProps) {
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-[#0A6EBD]";
  const dotColor = isDark ? "bg-white" : "bg-[#0A6EBD]";

  const inner = (
    <span className={`${className} font-bold lowercase tracking-tight`.trim()}>
      <LogoDot className={dotColor} />
      <span className={`${textColor} ${textClassName}`.trim()}>systemklar</span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
