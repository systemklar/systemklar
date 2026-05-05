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
      className={`relative inline-grid min-w-max shrink-0 place-items-center whitespace-nowrap text-sm transition-colors ${
        active ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      <span aria-hidden className="invisible col-start-1 row-start-1 px-px font-semibold">
        {label}
      </span>
      <span
        className={`col-start-1 row-start-1 px-px ${active ? "font-semibold" : "font-medium"}`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </span>
    </Link>
  );
}
