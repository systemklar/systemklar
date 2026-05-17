"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar, type AdminNavKey } from "@/components/admin/AdminSidebar";
import { NavigationProgress, PageTransition } from "@/components/PageTransition";
import { createClient } from "@/lib/supabase";

function activeNavFromPath(pathname: string): AdminNavKey {
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/dashboard") ||
    pathname.startsWith("/admin/overblik")
  ) {
    return "overview";
  }
  if (pathname.startsWith("/admin/customers")) {
    return "customers";
  }
  if (pathname.startsWith("/admin/tickets")) {
    return "tickets";
  }
  if (pathname.startsWith("/admin/it-rapporter") || pathname.startsWith("/admin/reports")) {
    return "itRapporter";
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

/**
 * Layout antager at adgang allerede er valideret server-side via `requireAdmin()`
 * i hver admin-page. Layoutet rendrer udelukkende sidebar/topbar-skellet.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/set-password";

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    queueMicrotask(() => closeSidebar());
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen || isAuthPage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen, isAuthPage]);

  useEffect(() => {
    if (isAuthPage) return;

    const handleBeforeUnload = () => {
      if (window.localStorage.getItem("adminRememberMe") === "true") return;
      const supabase = createClient();
      void supabase.auth.signOut({ scope: "local" });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  const activeNav = activeNavFromPath(pathname);

  return (
    <div className="surface-cards flex h-dvh overflow-x-hidden bg-[#F2F5FA] text-[#0A1628]">
      <NavigationProgress />
      <div className="flex h-full min-h-0 w-full overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Luk menu"
            className="fixed inset-0 z-40 bg-[#0A1628]/50 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        ) : null}

        <AdminSidebar activeNav={activeNav} open={sidebarOpen} onClose={closeSidebar} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex flex-shrink-0 items-center gap-3 border-b border-[#CBD5E8] bg-white px-3 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-[#2A4868] hover:bg-[#E8EEFC]"
              aria-label="Åbn menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="min-w-0 flex-1 text-center text-sm font-bold text-[#2952A3]">Admin</span>
            <span className="w-11 shrink-0" aria-hidden />
          </header>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="app-rhythm mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
