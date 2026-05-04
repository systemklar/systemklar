"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { fetchPortalReportDetail, type ReportDetailRow } from "@/lib/report-detail-fetch";
import { createClient } from "@/lib/supabase";

export default function PortalRapportDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [payload, setPayload] = useState<{
    report: ReportDetailRow;
    company_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!id) {
      setPayload(null);
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      router.replace("/login");
      setPayload(null);
      setLoading(false);
      return;
    }

    const row = await fetchPortalReportDetail(supabase, id, user.id);
    setPayload(row);
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (loading) {
    return (
      <PortalLayout activeNav="rapport">
        <p className="text-slate-600">Indlæser rapport...</p>
      </PortalLayout>
    );
  }

  if (!payload) {
    return (
      <PortalLayout activeNav="rapport">
        <Link href="/portal/rapport" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til IT-rapport
        </Link>
        <p className="mt-6 text-sm text-slate-600">Rapporten findes ikke.</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout activeNav="rapport">
      <ReportDetailView
        report={payload.report}
        companyName={payload.company_name}
        backHref="/portal/rapport"
        backLabel="← Tilbage til IT-rapport"
      />
    </PortalLayout>
  );
}
