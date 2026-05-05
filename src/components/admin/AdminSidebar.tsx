"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";

export type AdminNavKey = "overview" | "customers" | "tickets" | "reports" | "systems";

type AdminSidebarProps = {
  activeNav: AdminNavKey;
};

const accent = "#1D9E75";

function DotIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: { label: string; href: string; key: AdminNavKey; icon: ReactNode }[] = [
  { label: "Overblik", href: "/admin/dashboard", key: "overview", icon: <DotIcon path="M4 19h16M5 16V9m7 7V5m7 11v-6" /> },
  { label: "Kunder", href: "/admin/customers", key: "customers", icon: <DotIcon path="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 12v-1a4 4 0 0 0-3-3.87M15 4.13a3 3 0 0 1 0 5.74" /> },
  { label: "Support & sager", href: "/admin/tickets", key: "tickets", icon: <DotIcon path="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Z" /> },
  { label: "IT-rapporter", href: "/admin/reports", key: "reports", icon: <DotIcon path="M7 4h7l3 3v13H7zM14 4v3h3M10 12h4M10 15h4" /> },
  { label: "Systemer", href: "/admin/systemer", key: "systems", icon: <DotIcon path="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l3 3m6 6 3 3m0-12-3 3m-6 6-3 3" /> },
];

export function AdminSidebar({ activeNav }: AdminSidebarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <aside className="flex min-h-screen w-full max-w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href="/admin/dashboard" className="block">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <div className="text-lg font-bold leading-snug" style={{ color: accent }}>
              Systemklar Admin
            </div>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">Kontrolpanel</p>
          </div>
        </Link>

        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.key === activeNav;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="btn-primary mt-8 w-full px-4 py-2.5 text-sm font-semibold"
      >
        Log ud
      </button>
    </aside>
  );
}
