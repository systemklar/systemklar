"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar, type AdminNavKey } from "@/components/admin/AdminSidebar";
import { useAdminAccess } from "./use-admin-access";

function activeNavFromPath(pathname: string): AdminNavKey {
  if (pathname === "/admin" || pathname.startsWith("/admin/dashboard")) {
    return "overview";
  }
  if (pathname.startsWith("/admin/customers")) {
    return "customers";
  }
  if (pathname.startsWith("/admin/tickets")) {
    return "tickets";
  }
  if (pathname.startsWith("/admin/reports")) {
    return "reports";
  }
  if (pathname.startsWith("/admin/emails")) {
    return "emails";
  }
  if (pathname.startsWith("/admin/systemer")) {
    return "systems";
  }
  return "overview";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const access = useAdminAccess();

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/set-password"
  ) {
    return <>{children}</>;
  }

  const activeNav = activeNavFromPath(pathname);

  if (access === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5FAFD] text-slate-600">
        <p>Indlæser...</p>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <main className="min-h-screen bg-[#F5FAFD] px-6 py-20 text-slate-900">
        <h1 className="text-xl font-semibold">Adgang nægtet</h1>
        <p className="mt-2 text-sm text-slate-600">Du har ikke adgang til admin-området.</p>
      </main>
    );
  }

  return (
    <div className="surface-cards flex min-h-screen bg-[#F5FAFD] text-slate-900">
      <AdminSidebar activeNav={activeNav} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="app-rhythm mx-auto w-full max-w-6xl px-6 py-10 md:px-8 md:py-12">{children}</div>
      </div>
    </div>
  );
}
