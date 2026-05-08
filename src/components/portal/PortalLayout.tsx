"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut, Menu, User, Users, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Logo } from "@/components/ui/Logo";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase";

export type PortalNavKey =
  | "dashboard"
  | "support"
  | "rapport"
  | "tilbudsgenerator"
  | "systems"
  | "vault"
  | "ai"
  | "guides"
  | "team"
  | "profile";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3M7 10h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d="M7 4h7l3 3v13H7z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 4v3h3M10 12h4M10 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SystemsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l3 3m6 6 3 3m0-12-3 3m-6 6-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path
        d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5 10.8 12 12 15.5 13.2 12 12 8.5Zm-4.2 3.5L5.5 12l2.3.5L8.5 15l.5-2.3L11 12l-2.3-.5L8.5 9l-.5 2.3Zm8.4 0L19.5 12l-2.3.5L15.5 15l-.5-2.3L13 12l2.3-.5L15.5 9l.5 2.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.5 6.5l2.8 2.8m5.4 5.4 2.8 2.8m0-11-2.8 2.8m-5.4 5.4-2.8 2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const navItems: { label: string; href: string; key: PortalNavKey; icon?: ReactNode; adminOnly?: boolean }[] = [
  { label: "Overblik", href: "/portal", key: "dashboard", icon: <HomeIcon /> },
  { label: "Support & sager", href: "/portal/support", key: "support", icon: <TicketIcon /> },
  { label: "Kodebank", href: "/portal/kodebank", key: "vault", icon: <LockIcon /> },
  { label: "IT-rapport", href: "/portal/rapport", key: "rapport", icon: <ReportIcon /> },
  { label: "Systemer", href: "/portal/systemer", key: "systems", icon: <SystemsIcon /> },
  {
    label: "AI Tilbudsgenerator",
    href: "/portal/tilbudsgenerator",
    key: "tilbudsgenerator",
    icon: <SparklesIcon />,
  },
  { label: "AI-assistent", href: "/portal/ai-assistent", key: "ai", icon: <AiIcon /> },
  {
    label: "Vejledninger",
    href: "/portal/vejledninger",
    key: "guides",
    icon: <BookOpen className="h-4 w-4 flex-shrink-0" aria-hidden />,
  },
  { label: "Team", href: "/portal/team", key: "team", icon: <Users className="h-4 w-4 flex-shrink-0" />, adminOnly: true },
  { label: "Profil", href: "/portal/profil", key: "profile", icon: <User className="h-4 w-4 flex-shrink-0" /> },
];

type PortalSession = {
  email: string | null;
  userId: string | null;
  organisationId: string | null;
  role: string | null;
  fullName: string | null;
};

const PortalSessionContext = createContext<PortalSession | null>(null);

export function usePortalSession() {
  const ctx = useContext(PortalSessionContext);
  return ctx;
}

type PortalLayoutProps = {
  children: ReactNode;
  activeNav: PortalNavKey;
};

export function PortalLayout({ children, activeNav }: PortalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setSidebarOpen(false));
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session: { user: { id: string; email?: string | null } } | null) => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      const profile = await fetchCurrentProfile(supabase, session.user.id);
      if (cancelled) return;
      setUserEmail(session.user.email ?? null);
      setUserId(session.user.id);
      setRole(profile?.role ?? null);
      setOrganisationId(profile?.organisation_id ?? null);
      setFullName(profile?.full_name ?? null);
      setIsLoading(false);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void applySession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        void applySession(session);
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        void applySession(session);
        return;
      }
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-6 py-20 text-[#1C1917]">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center shadow-sm">
          Indlæser portal...
        </div>
      </main>
    );
  }

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || role === "org_admin");
  const navGroups = [
    { label: "Platform", keys: ["dashboard", "support", "rapport", "systems"] as PortalNavKey[] },
    { label: "Værktøjer", keys: ["vault", "tilbudsgenerator", "ai"] as PortalNavKey[] },
    { label: "Konto", keys: ["guides", "team", "profile"] as PortalNavKey[] },
  ];

  return (
    <PortalSessionContext.Provider value={{ email: userEmail, userId, organisationId, role, fullName }}>
      <main className="surface-cards min-h-screen bg-[#F5FAFD] text-[#0D1F2D]">
        <div className="flex h-screen w-full overflow-hidden">
          {sidebarOpen ? (
            <button
              type="button"
              aria-label="Luk menu"
              className="fixed inset-0 z-20 bg-black/30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-30 flex h-full w-56 flex-shrink-0 flex-col border-r border-sky-100 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-sky-50 p-4">
              <Link href="/portal" className="block" aria-label="systemklar – kundeportal">
                <Logo />
                <p className="mt-0.5 text-xs font-medium text-[#4A8CB5]">Kundeportal</p>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-[#2C4A5E] md:hidden"
                aria-label="Luk menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {navGroups.map((group) => {
                const items = visibleNavItems.filter((item) => group.keys.includes(item.key));
                if (items.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-0.5">
                    <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#7AAEC8]">
                      {group.label}
                    </p>
                    {items.map((item) => {
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
                );
              })}
            </nav>

            <div className="flex-shrink-0 border-t border-sky-50 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#4A8CB5] transition-all hover:bg-red-50 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
                Log ud
              </button>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#F5FAFD]">
            <div className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-sky-100 bg-white px-4 py-3 md:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-[#2C4A5E]"
                aria-label="Åbn menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-sky-600">systemklar</span>
              <span className="w-9" aria-hidden />
            </div>

            <div className="app-rhythm min-w-0 flex-1 p-4 md:p-8">{children}</div>
          </section>
        </div>
      </main>
    </PortalSessionContext.Provider>
  );
}
