"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";
import { PortalSystemsDashboard } from "@/components/portal/PortalSystemsDashboard";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase";

function DashboardContent() {
  const session = usePortalSession();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [profileFullName, setProfileFullName] = useState<string | null>(null);
  const [onboardingSystemNames, setOnboardingSystemNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const user = authSession?.user;
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const profile = await fetchCurrentProfile(supabase, user.id);
      if (cancelled) return;
      setProfileFullName(profile?.full_name ?? null);
      const raw = profile?.onboarding_systems;
      const names = Array.isArray(raw)
        ? raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
        : [];
      setOnboardingSystemNames(names);
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) {
    return <p className="text-sm text-[#4A8CB5]">Indlæser overblik...</p>;
  }

  const displayName =
    profileFullName?.trim() ||
    session?.fullName?.trim() ||
    session?.email?.split("@")[0] ||
    null;

  return <PortalSystemsDashboard fullName={displayName} onboardingSystemNames={onboardingSystemNames} />;
}

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <DashboardContent />
    </PortalLayout>
  );
}
