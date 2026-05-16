"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * Fixed support CTA — mounted on portal layout root so it never shifts with page content.
 */
export function PortalSupportFab() {
  return (
    <Link
      href="/portal/support"
      className="fixed bottom-8 right-8 z-50 inline-flex items-center gap-1.5 rounded-full bg-[#062840] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0D1F2D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A6EBD] focus-visible:ring-offset-2 max-md:bottom-24 max-md:right-4"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      Opret IT-sag
    </Link>
  );
}
