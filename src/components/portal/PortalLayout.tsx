"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  FileSignature,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Sparkles,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { NavigationProgress, PageTransition } from "@/components/PageTransition";
import { fetchCurrentProfile } from "@/lib/current-profile";
import {
  PORTAL_PROFILE_AVATAR_UPDATED_EVENT,
  withCacheBust,
} from "@/lib/storage-public-urls";
import { PORTAL_TOUR_OPEN_SIDEBAR_EVENT } from "@/components/portal/portal-onboarding-tour";
import { needsOnboarding } from "@/lib/onboarding";
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

const navIconClass = "h-5 w-5 shrink-0";

type NavItemDef = {
  label: string;
  href: string;
  key: PortalNavKey;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navItems: NavItemDef[] = [
  { label: "Overblik", href: "/portal", key: "dashboard", icon: LayoutDashboard },
  { label: "Support & sager", href: "/portal/support", key: "support", icon: MessageSquare },
  { label: "IT-rapport", href: "/portal/rapport", key: "rapport", icon: FileText },
  { label: "Systemer", href: "/portal/systemer", key: "systems", icon: Monitor },
  { label: "Kodebank", href: "/portal/kodebank", key: "vault", icon: Lock },
  {
    label: "AI Tilbudsgenerator",
    href: "/portal/tilbudsgenerator",
    key: "tilbudsgenerator",
    icon: FileSignature,
  },
  { label: "AI-assistent", href: "/portal/ai-assistent", key: "ai", icon: Sparkles },
  { label: "Vejledninger", href: "/portal/vejledninger", key: "guides", icon: BookOpen },
  { label: "Team", href: "/portal/team", key: "team", icon: Users },
  { label: "Profil", href: "/portal/profil", key: "profile", icon: User },
];

const mobileBottomNav: { key: PortalNavKey; href: string; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/portal", label: "Overblik", icon: LayoutDashboard },
  { key: "support", href: "/portal/support", label: "Support", icon: MessageSquare },
  { key: "rapport", href: "/portal/rapport", label: "IT-rapport", icon: FileText },
  { key: "systems", href: "/portal/systemer", label: "Systemer", icon: Monitor },
  { key: "profile", href: "/portal/profil", label: "Profil", icon: User },
];

function NavIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  return (
    <Icon
      className={`${navIconClass} ${active ? "text-[#6A92D8]" : "text-[#2A4868] group-hover:text-[#6A92D8]"}`}
      aria-hidden
    />
  );
}

/** Bruges af `app/portal/layout.tsx` til at holde sidenav i sync med URL uden at duplikere logik per side. */
export function activeNavFromPortalPath(pathname: string | null): PortalNavKey {
  const p = pathname ?? "";
  if (p === "/portal" || p === "/portal/") return "dashboard";
  if (p.startsWith("/portal/support")) return "support";
  if (p.startsWith("/portal/kodebank")) return "vault";
  if (p.startsWith("/portal/rapport")) return "rapport";
  if (p.startsWith("/portal/systemer")) return "systems";
  if (p.startsWith("/portal/tilbudsgenerator") || p.startsWith("/portal/tilbud")) return "tilbudsgenerator";
  if (p.startsWith("/portal/ai-assistent")) return "ai";
  if (p.startsWith("/portal/vejledninger")) return "guides";
  if (p.startsWith("/portal/team")) return "team";
  if (p.startsWith("/portal/profil")) return "profile";
  return "dashboard";
}

type PortalSession = {
  email: string | null;
  userId: string | null;
  organisationId: string | null;
  role: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  avatarInitials: string | null;
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
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    queueMicrotask(() => closeSidebar());
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const openSidebarForTour = () => setSidebarOpen(true);
    window.addEventListener(PORTAL_TOUR_OPEN_SIDEBAR_EVENT, openSidebarForTour);
    return () => window.removeEventListener(PORTAL_TOUR_OPEN_SIDEBAR_EVENT, openSidebarForTour);
  }, []);

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

      const path = pathnameRef.current ?? "";
      const onOnboardingRoute = path.startsWith("/portal/onboarding");
      if (profile && needsOnboarding(profile.onboarding_completed)) {
        if (!onOnboardingRoute) {
          router.replace("/portal/onboarding");
          return;
        }
      } else if (onOnboardingRoute) {
        router.replace("/portal");
        return;
      }

      setUserEmail(session.user.email ?? null);
      setUserId(session.user.id);
      setRole(profile?.role ?? null);
      setOrganisationId(profile?.organisation_id ?? null);
      setFullName(profile?.full_name ?? null);
      const storedAvatar = profile?.avatar_url?.trim();
      setAvatarUrl(storedAvatar ? withCacheBust(storedAvatar) : null);
      const initials = profile?.avatar_initials?.trim();
      if (initials) {
        setAvatarInitials(initials.slice(0, 2).toUpperCase());
      } else {
        const name = profile?.full_name?.trim() || session.user.email || "U";
        setAvatarInitials(
          name
            .split(/\s+/)
            .map((p) => p[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        );
      }
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

  useEffect(() => {
    if (!userId) return;

    const refreshSidebarAvatar = async () => {
      const profile = await fetchCurrentProfile(supabase, userId);
      const storedAvatar = profile?.avatar_url?.trim();
      setAvatarUrl(storedAvatar ? withCacheBust(storedAvatar) : null);
      const initials = profile?.avatar_initials?.trim();
      if (initials) {
        setAvatarInitials(initials.slice(0, 2).toUpperCase());
      }
    };

    const onAvatarUpdated = () => {
      void refreshSidebarAvatar();
    };

    window.addEventListener(PORTAL_PROFILE_AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(PORTAL_PROFILE_AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, [userId, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#F2F5FA] px-6 py-20 text-[#0A1628]">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#CBD5E8] bg-white p-8 text-center shadow-sm">
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
    <PortalSessionContext.Provider
      value={{ email: userEmail, userId, organisationId, role, fullName, avatarUrl, avatarInitials }}
    >
      <main className="surface-cards h-dvh overflow-x-hidden bg-[#F2F5FA] text-[#0A1628]">
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

          <aside
            data-tour="portal-sidebar"
            className={`sk-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-[280px] flex-shrink-0 flex-col border-r shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="sk-sidebar-logo flex flex-shrink-0 items-center justify-between border-b">
              <Link href="/portal" className="block" onClick={closeSidebar}>
                <SystemklarLogo variant="dark" size="sm" />
                <p className="sk-sidebar-user-muted mt-0.5 text-xs font-medium">Kundeportal</p>
              </Link>
              <button
                type="button"
                onClick={closeSidebar}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#6A92D8] hover:bg-white/[0.04] lg:hidden"
                aria-label="Luk menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
              {navGroups.map((group) => {
                const items = visibleNavItems.filter((item) => group.keys.includes(item.key));
                if (items.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-0.5">
                    <p className="sk-sidebar-section-label mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest">
                      {group.label}
                    </p>
                    {items.map((item) => {
                      const isActive = item.key === activeNav;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          onClick={closeSidebar}
                          className={`group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isActive ? "sk-sidebar-nav-active" : "sk-sidebar-nav-inactive"
                          }`}
                        >
                          <NavIcon icon={item.icon} active={isActive} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="flex-shrink-0 border-t border-white/10 p-3">
              <Link
                href="/portal/profil"
                onClick={closeSidebar}
                className="mb-2 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/6"
              >
                <ProfileAvatar
                  avatarUrl={avatarUrl}
                  initials={avatarInitials ?? "?"}
                  className="h-9 w-9 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#6A92D8]">
                    {fullName?.trim() || "Min profil"}
                  </p>
                  <p className="sk-sidebar-user-muted truncate text-xs">{userEmail}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="sk-sidebar-nav-inactive group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <LogOut className={`${navIconClass} text-[#6A82A8] group-hover:text-[#6A92D8]`} aria-hidden />
                Log ud
              </button>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F2F5FA]">
            <header className="sticky top-0 z-30 flex flex-shrink-0 items-center gap-3 border-b border-[#CBD5E8] bg-white px-3 py-2 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-[#2A4868] hover:bg-[#E8EEFC]"
                aria-label="Åbn menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/portal" className="min-w-0 flex-1 truncate">
                <SystemklarLogo variant="light" size="sm" />
              </Link>
              <span className="w-11 shrink-0" aria-hidden />
            </header>

            <div
              className={`app-rhythm flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden ${
                activeNav === "dashboard"
                  ? "overflow-y-auto p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:overflow-hidden lg:p-4 lg:pb-4"
                  : "overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8"
              }`}
            >
              <PageTransition>{children}</PageTransition>
            </div>
          </section>
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#CBD5E8] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden"
          aria-label="Hovednavigation mobil"
        >
          {mobileBottomNav.map((item) => {
            const isActive = item.key === activeNav;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors ${
                  isActive ? "text-[#1E4490]" : "text-[#6A82A8] hover:text-[#2A4868]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="sr-only text-[10px] font-medium sm:not-sr-only sm:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </PortalSessionContext.Provider>
  );
}
