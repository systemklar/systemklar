"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase";

export type AdminNavKey = "overview" | "customers" | "tickets" | "reports";

type AdminSidebarProps = {
  activeNav: AdminNavKey;
};

const accent = "#1D9E75";

const navItems: { label: string; href: string; key: AdminNavKey }[] = [
  { label: "Overblik", href: "/admin", key: "overview" },
  { label: "Kunder", href: "/admin/customers", key: "customers" },
  { label: "Support & sager", href: "/admin/tickets", key: "tickets" },
  { label: "IT-rapporter", href: "/admin/reports", key: "reports" },
];

export function AdminSidebar({ activeNav }: AdminSidebarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <aside className="flex min-h-screen w-full max-w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href="/admin" className="block">
          <div className="text-lg font-bold leading-snug" style={{ color: accent }}>
            Systemklar Admin
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="mt-8 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        Log ud
      </button>
    </aside>
  );
}
