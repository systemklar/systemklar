"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalSystemsDashboard } from "@/components/portal/PortalSystemsDashboard";

type OrgProfile = {
  full_name: string | null;
  role: string | null;
  onboarding_systems?: string[] | null;
};

type OrganisationPayload = {
  id: string;
  profiles: OrgProfile[] | null;
};

export default function AdminCustomerPortalDashboardPreview() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [org, setOrg] = useState<OrganisationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setOrg(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/organisations/${encodeURIComponent(id)}`, {
        credentials: "include",
        redirect: "manual",
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; organisation?: OrganisationPayload };
      if (!res.ok) {
        setOrg(null);
        setError(payload.error ?? "Kunne ikke hente virksomhed.");
        return;
      }
      if (!payload.organisation) {
        setOrg(null);
        setError("Virksomhed ikke fundet.");
        return;
      }
      setOrg(payload.organisation);
    } catch {
      setOrg(null);
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const onboardingSystemNames = useMemo(() => {
    const list = org?.profiles ?? [];
    const names = new Set<string>();
    for (const p of list) {
      const arr = p.onboarding_systems;
      if (!Array.isArray(arr)) continue;
      for (const n of arr) {
        const t = typeof n === "string" ? n.trim() : "";
        if (t) names.add(t);
      }
    }
    return [...names];
  }, [org?.profiles]);

  const previewFullName = useMemo(() => {
    const profiles = org?.profiles ?? [];
    const admin = profiles.find((p) => p.role === "org_admin");
    const pick = admin ?? profiles[0];
    return pick?.full_name ?? null;
  }, [org?.profiles]);

  if (loading) {
    return <p className="text-sm text-[#2A4868]">Indlæser dashboard...</p>;
  }

  if (error || !org) {
    return (
      <div className="space-y-4">
        <Link href={`/admin/customers/${id || ""}`} className="text-sm font-semibold text-[#1E4490] hover:underline">
          ← Tilbage til kunde
        </Link>
        <p className="text-sm text-red-700">{error ?? "Kunde ikke fundet."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/admin/customers/${org.id}`} className="text-sm font-semibold text-[#1E4490] hover:underline">
          ← Tilbage til kunde
        </Link>
      </div>
      <PortalSystemsDashboard
        fullName={previewFullName}
        onboardingSystemNames={onboardingSystemNames}
        organisationId={org.id}
        preview
      />
    </div>
  );
}
