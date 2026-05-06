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
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-grid min-w-max shrink-0 place-items-center whitespace-nowrap text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-sky-600 after:transition-all after:duration-200 hover:after:w-full ${
        active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
      }`}
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
