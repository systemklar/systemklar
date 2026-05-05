"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase";

export type PortalNavKey =
  | "dashboard"
  | "support"
  | "rapport"
  | "services"
  | "tilbud"
  | "systems"
  | "vault"
  | "ai";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3M7 10h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems: { label: string; href: string; key: PortalNavKey; icon?: ReactNode }[] = [
  { label: "Overblik", href: "/portal", key: "dashboard" },
  { label: "Support & sager", href: "/portal/support", key: "support" },
  { label: "Kodebank", href: "/portal/kodebank", key: "vault", icon: <LockIcon /> },
  { label: "IT-rapport", href: "/portal/rapport", key: "rapport" },
  { label: "Systemer", href: "/portal/systemer", key: "systems" },
  { label: "Tjenester", href: "/portal/tjenester", key: "services" },
  { label: "Tilbud", href: "/portal/tilbud", key: "tilbud" },
  { label: "AI-assistent", href: "#", key: "ai" },
];

type PortalSession = {
  email: string | null;
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
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: { user: { email?: string | null } } | null) => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      setUserEmail(session.user.email ?? null);
      setIsLoading(false);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        applySession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        applySession(session);
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        applySession(session);
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
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          Indlæser portal...
        </div>
      </main>
    );
  }

  return (
    <PortalSessionContext.Provider value={{ email: userEmail }}>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl">
          <aside className="w-full max-w-72 border-r border-slate-200 bg-white p-6">
            <Link href="/portal" className="block">
              <div className="text-2xl font-bold" style={{ color: "#1D9E75" }}>
                Systemklar
              </div>
            </Link>
            <p className="mt-1 text-sm text-slate-500">Kundeportal</p>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const isActive = item.key === activeNav;
                const isPlaceholder = item.href === "#";

                if (isPlaceholder) {
                  return (
                    <span
                      key={item.key}
                      className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
                    >
                      <span className="inline-flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-100"
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

            <button
              type="button"
              onClick={handleLogout}
              className="mt-10 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#1D9E75" }}
            >
              Log ud
            </button>
          </aside>

          <section className="flex-1 p-6 md:p-10">{children}</section>
        </div>
      </main>
    </PortalSessionContext.Provider>
  );
}
