"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Mail, X } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { createClient } from "@/lib/supabase";

export type AdminNavKey =
  | "overview"
  | "customers"
  | "tickets"
  | "itRapporter"
  | "emails"
  | "guides"
  | "systems";

type AdminSidebarProps = {
  activeNav: AdminNavKey;
  open?: boolean;
  onClose?: () => void;
};

function DotIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: { label: string; href: string; key: AdminNavKey; icon: ReactNode }[] = [
  { label: "Overblik", href: "/admin/overblik", key: "overview", icon: <DotIcon path="M4 19h16M5 16V9m7 7V5m7 11v-6" /> },
  { label: "Kunder", href: "/admin/customers", key: "customers", icon: <DotIcon path="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 12v-1a4 4 0 0 0-3-3.87M15 4.13a3 3 0 0 1 0 5.74" /> },
  { label: "Support & sager", href: "/admin/tickets", key: "tickets", icon: <DotIcon path="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Z" /> },
  { label: "IT-rapporter", href: "/admin/it-rapporter", key: "itRapporter", icon: <DotIcon path="M7 4h7l3 3v13H7zM14 4v3h3M10 12h4M10 15h4" /> },
  {
    label: "Email-skabeloner",
    href: "/admin/emails",
    key: "emails",
    icon: <Mail className="h-4 w-4 flex-shrink-0" aria-hidden />,
  },
  {
    label: "Vejledninger",
    href: "/admin/vejledninger",
    key: "guides",
    icon: <BookOpen className="h-4 w-4 flex-shrink-0" aria-hidden />,
  },
  { label: "Systemer", href: "/admin/systemer", key: "systems", icon: <DotIcon path="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l3 3m6 6 3 3m0-12-3 3m-6 6-3 3" /> },
];

export function AdminSidebar({ activeNav, open = false, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const navGroups = [
    { label: "Overblik", keys: ["overview"] as AdminNavKey[] },
    { label: "Kunder", keys: ["customers", "tickets"] as AdminNavKey[] },
    { label: "Indhold", keys: ["itRapporter", "guides", "emails"] as AdminNavKey[] },
    { label: "System", keys: ["systems"] as AdminNavKey[] },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <aside
      className={`sk-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col border-r shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-auto lg:min-h-screen lg:translate-x-0 lg:shadow-none ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="sk-sidebar-logo flex flex-shrink-0 items-center justify-between border-b px-4 py-4">
        <Link href="/admin/overblik" className="block" onClick={onClose}>
          <SystemklarLogo variant="dark" size="sm" />
          <p className="sk-sidebar-user-muted mt-0.5 text-xs font-medium">Admin</p>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#A8C8E0] hover:bg-white/10 lg:hidden"
          aria-label="Luk menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="sk-sidebar-section-label mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest">
              {group.label}
            </p>
            {navItems
              .filter((item) => group.keys.includes(item.key))
              .map((item) => {
                const isActive = item.key === activeNav;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive ? "sk-sidebar-nav-active" : "sk-sidebar-nav-inactive"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="sk-sidebar-nav-inactive flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log ud
        </button>
      </div>
    </aside>
  );
}
