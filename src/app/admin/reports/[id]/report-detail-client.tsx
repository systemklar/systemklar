"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { fetchAdminReportDetail, type ReportDetailRow } from "@/lib/report-detail-fetch";
import { createClient } from "@/lib/supabase";

export default function AdminReportDetailClient() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [payload, setPayload] = useState<{
    report: ReportDetailRow;
    company_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setPayload(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const row = await fetchAdminReportDetail(supabase, id);
    setPayload(row);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (loading) {
    return <p className="text-sm text-slate-600">Indlæser rapport...</p>;
  }

  if (!payload) {
    return (
      <div>
        <Link href="/admin/reports" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Tilbage til IT-rapporter
        </Link>
        <p className="mt-6 text-sm text-slate-600">Rapporten findes ikke.</p>
      </div>
    );
  }

  return (
    <div>
      <ReportDetailView
        report={payload.report}
        companyName={payload.company_name}
        backHref="/admin/reports"
        backLabel="← Tilbage til IT-rapporter"
      />
    </div>
  );
}
