"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Mail, X } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { SystemklarLogo } from "@/components/branding/SystemklarLogo";
import { createClient } from "@/lib/supabase";

export type AdminNavKey =
  | "overview"
  | "customers"
  | "tickets"
  | "reports"
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
  { label: "Overblik", href: "/admin/dashboard", key: "overview", icon: <DotIcon path="M4 19h16M5 16V9m7 7V5m7 11v-6" /> },
  { label: "Kunder", href: "/admin/customers", key: "customers", icon: <DotIcon path="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 12v-1a4 4 0 0 0-3-3.87M15 4.13a3 3 0 0 1 0 5.74" /> },
  { label: "Support & sager", href: "/admin/tickets", key: "tickets", icon: <DotIcon path="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Z" /> },
  { label: "IT-rapporter", href: "/admin/reports", key: "reports", icon: <DotIcon path="M7 4h7l3 3v13H7zM14 4v3h3M10 12h4M10 15h4" /> },
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
    { label: "Indhold", keys: ["reports", "guides", "emails"] as AdminNavKey[] },
    { label: "System", keys: ["systems"] as AdminNavKey[] },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-sky-100 bg-white p-4 transition-transform duration-300 md:static md:h-auto md:min-h-screen md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between border-b border-sky-50 pb-4">
          <Link href="/admin/dashboard" className="block">
            <SystemklarLogo
              variant="light"
              textClassName="text-sm font-bold tracking-tight text-sky-700"
            />
            <p className="mt-0.5 text-xs font-medium text-[#4A8CB5]">Admin</p>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#2C4A5E] md:hidden"
            aria-label="Luk menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#7AAEC8]">
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
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "border border-sky-100 bg-sky-50 font-semibold text-sky-700"
                          : "text-[#2C4A5E] hover:bg-[#F0F7FF] hover:text-sky-700"
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
      </div>

      <div className="mt-auto border-t border-sky-50 pt-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#4A8CB5] transition-all hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          Log ud
        </button>
      </div>
    </aside>
  );
}
