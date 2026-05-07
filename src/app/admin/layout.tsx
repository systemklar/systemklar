"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
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
  if (pathname.startsWith("/admin/vejledninger")) {
    return "guides";
  }
  if (pathname.startsWith("/admin/systemer")) {
    return "systems";
  }
  return "overview";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const access = useAdminAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setSidebarOpen(false));
  }, [pathname]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#F5FAFD] text-[#2C4A5E]">
        <p>Indlæser...</p>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <main className="min-h-screen bg-[#F5FAFD] px-6 py-20 text-[#0D1F2D]">
        <h1 className="text-xl font-semibold">Adgang nægtet</h1>
        <p className="mt-2 text-sm text-[#2C4A5E]">Du har ikke adgang til admin-området.</p>
      </main>
    );
  }

  return (
    <div className="surface-cards flex h-screen overflow-hidden bg-[#F5FAFD] text-[#0D1F2D]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Luk menu"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <AdminSidebar activeNav={activeNav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sky-100 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#2C4A5E]"
            aria-label="Åbn menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-sky-600">Admin</span>
          <span className="w-9" aria-hidden />
        </div>

        <div className="app-rhythm mx-auto w-full max-w-6xl p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
