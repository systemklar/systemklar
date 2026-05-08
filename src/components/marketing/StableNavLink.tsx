"use client";

import Link from "next/link";

/**
 * Aktiv tilstand må ikke ændre bredde/hop: usynlig reserves font-semibold-bredde;
 * aktiv skifter kun synlig vægt/farve.
 */
export function StableNavLink({
  href,
  label,
  active,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  const colorClasses =
    className ?? (active ? "text-[#0D1F2D]" : "text-slate-600 hover:text-[#0D1F2D]");
  return (
    <Link
      href={href}
      className={`relative inline-grid min-w-max shrink-0 place-items-center whitespace-nowrap text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#0A6EBD] after:transition-all after:duration-200 hover:after:w-full ${colorClasses}`}
    >
      <span aria-hidden className="invisible col-start-1 row-start-1 px-px font-semibold">
        {label}
      </span>
      <span
        className={`col-start-1 row-start-1 px-px font-medium ${active ? "font-semibold" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </span>
    </Link>
  );
}
