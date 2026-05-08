"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Monitor, Ticket } from "lucide-react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { createClient } from "@/lib/supabase";

type SystemRow = {
  id: string;
  name: string;
  status: "ok" | "advarsel" | "nede";
  type: string;
};

const statusStyles: Record<SystemRow["status"], string> = {
  ok: "bg-green-100 text-green-800",
  advarsel: "bg-amber-100 text-amber-900",
  nede: "bg-red-100 text-red-800",
};

function StatusDot({ status }: { status: SystemRow["status"] }) {
  const color = status === "ok" ? "bg-green-500" : status === "advarsel" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />;
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const stepMs = 40;
    const steps = Math.max(1, Math.floor(duration / stepMs));
    let currentStep = 0;
    const timer = window.setInterval(() => {
      currentStep += 1;
      const next = Math.round((value * currentStep) / steps);
      setDisplay(next);
      if (currentStep >= steps) window.clearInterval(timer);
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

function DashboardContent() {
  const session = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [recentTickets, setRecentTickets] = useState<
    { id: string; title: string; status: string; created_at: string }[]
  >([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [profileFullName, setProfileFullName] = useState<string | null>(null);
  const [profileCompanyName, setProfileCompanyName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSystemsLoading(true);
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const user = authSession?.user;
      if (!user) return;
      const profile = await fetchCurrentProfile(supabase, user.id);
      if (!cancelled) {
        setProfileFullName(profile?.full_name ?? null);
        setProfileCompanyName(profile?.company_name ?? null);
        setProfileEmail(profile?.email ?? user.email ?? null);
      }
      if (!profile?.organisation_id) {
        setSystems([]);
        setRecentTickets([]);
        setSystemsLoading(false);
        return;
      }
      const [systemsRes, ticketsRes, companyRes] = await Promise.all([
        supabase
          .from("systems")
          .select("id, name, status, type")
          .eq("organisation_id", profile.organisation_id)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("tickets")
          .select("id,title,status,created_at")
          .eq("organisation_id", profile.organisation_id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("organisations").select("name").eq("id", profile.organisation_id).maybeSingle(),
      ]);
      if (cancelled) return;
      if (systemsRes.error) {
        setSystems([]);
      } else {
        setSystems((systemsRes.data ?? []) as SystemRow[]);
      }
      setRecentTickets(
        ((ticketsRes.data ?? []) as { id: string; title: string; status: string; created_at: string }[]) ?? [],
      );
      const orgName =
        companyRes.data?.name && companyRes.data.name.trim() ? companyRes.data.name.trim() : null;
      if (orgName && !profile.company_name) {
        setProfileCompanyName(orgName);
      }
      setSystemsLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const hasDown = systems.some((s) => s.status === "nede");
  const today = new Intl.DateTimeFormat("da-DK", { dateStyle: "full" }).format(new Date());
  const emailFallback = profileEmail ?? session?.email ?? null;
  const displayName =
    profileFullName?.trim() ||
    profileCompanyName?.trim() ||
    emailFallback?.split("@")[0] ||
    "der";

  const statCards = [
    { value: systems.length, label: "Systemer", icon: Monitor },
    { value: recentTickets.length, label: "Seneste sager", icon: Ticket },
    { value: hasDown ? 1 : 0, label: "Advarsler", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <AnimatedSection direction="up" delay={0} className="border-b border-sky-100 pb-6">
        <p className="mb-1 text-xs text-[#4A8CB5]">{today}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0D1F2D]">Goddag, {displayName}</h1>
        <p className="mt-2 text-sm text-[#4A8CB5]">Her er dagens overblik over systemstatus, handlinger og seneste sager.</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
          <AnimatedSection key={stat.label} direction="up" delay={(idx * 100) as 0 | 100 | 200 | 300}>
            <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F7FF]">
                <Icon className="h-4 w-4 text-[#0A6EBD]" />
              </div>
              <p className="mt-3 text-3xl font-bold text-[#0D1F2D]">
                <CountUp value={stat.value} />
              </p>
              <p className="mt-1 text-xs text-[#4A8CB5]">{stat.label}</p>
            </article>
          </AnimatedSection>
        );
        })}
      </div>

      <AnimatedSection direction="up" delay={100} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-[#0D1F2D]">Mine systemer</h2>
          <Link href="/portal/systemer" className="text-sm font-semibold text-[#0A6EBD] hover:underline">
            Se alle
          </Link>
        </div>
        {hasDown ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Advarsel: Et eller flere systemer er nede.
          </p>
        ) : null}
        {systemsLoading ? (
          <p className="mt-4 text-sm text-[#4A8CB5]">Henter systemer...</p>
        ) : systems.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-sky-100 bg-[#F0F7FF] p-6 text-center">
            <p className="text-sm font-medium text-[#0D1F2D]">Ingen systemer endnu</p>
            <p className="mt-1 text-sm text-[#4A8CB5]">Tilføj jeres systemer for at få status-overblik.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {systems.map((s) => (
              <article key={s.id} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#0D1F2D]">{s.name}</p>
                  <StatusDot status={s.status} />
                </div>
                <p className="mt-1 text-xs text-[#4A8CB5]">{s.type}</p>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[s.status]}`}>
                  {s.status === "ok" ? "Aktiv" : s.status === "advarsel" ? "Advarsel" : "Nede"}
                </span>
              </article>
            ))}
          </div>
        )}
      </AnimatedSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "Opret sag", href: "/portal/support", text: "Få hurtig hjælp fra supportteamet.", icon: "01" },
          { title: "Se systemer", href: "/portal/systemer", text: "Følg drift og status i realtid.", icon: "02" },
          { title: "Åbn kodebank", href: "/portal/kodebank", text: "Gem og find login-oplysninger sikkert.", icon: "03" },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-5 transition-all hover:border-sky-200 hover:shadow-md"
          >
            <p className="mb-2 text-xs font-bold text-sky-400">{card.icon}</p>
            <h3 className="text-sm font-semibold text-[#0D1F2D]">{card.title}</h3>
            <p className="mt-1 text-xs text-[#4A8CB5]">{card.text}</p>
          </Link>
        ))}
      </div>

      <AnimatedSection direction="up" delay={200} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#0D1F2D]">Seneste sager</h2>
          <Link href="/portal/support" className="text-sm font-semibold text-[#0A6EBD] hover:underline">
            Se alle
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-sky-100 bg-[#F0F7FF] p-6 text-center">
            <p className="text-sm font-medium text-[#0D1F2D]">Ingen sager endnu</p>
            <p className="mt-1 text-sm text-[#4A8CB5]">Opret en sag hvis du har brug for hjælp.</p>
          </div>
        ) : (
          <ul className="mt-4">
            {recentTickets.map((t) => (
              <li key={t.id} className="border-b border-sky-50 last:border-0">
                <Link href={`/portal/support/${t.id}`} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0D1F2D]">{t.title}</p>
                    <p className="text-xs text-[#4A8CB5]">
                      {new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(t.created_at))}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AnimatedSection>
    </div>
  );
}

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <DashboardContent />
    </PortalLayout>
  );
}
