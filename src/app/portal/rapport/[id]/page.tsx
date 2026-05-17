"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ItReportInlineView } from "@/components/reports/ItReportInlineView";
import { fetchPortalItReportDetail, type PortalItReportRow } from "@/lib/it-report-portal-fetch";
import { createClient } from "@/lib/supabase";

function RapportDetailShell({ children }: { children: ReactNode }) {
  return <div className="w-full p-6 md:p-8">{children}</div>;
}

export default function PortalRapportDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [report, setReport] = useState<PortalItReportRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!id) {
      setReport(null);
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      router.replace("/login");
      setReport(null);
      setLoading(false);
      return;
    }

    const row = await fetchPortalItReportDetail(supabase, id, user.id);
    setReport(row);
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (loading) {
    return (
      <RapportDetailShell>
        <p className="text-sm text-[#2A4868]">Indlæser rapport...</p>
      </RapportDetailShell>
    );
  }

  if (!report) {
    return (
      <RapportDetailShell>
        <Link href="/portal/rapport" className="text-sm font-semibold text-[#2952A3] hover:underline">
          ← Tilbage til IT-rapport
        </Link>
        <p className="mt-6 text-sm text-[#2A4868]">Rapporten findes ikke.</p>
      </RapportDetailShell>
    );
  }

  return (
    <RapportDetailShell>
      <ItReportInlineView
        report={report}
        backHref="/portal/rapport"
        backLabel="← Tilbage til IT-rapport"
        pdfHref={`/api/portal/reports/${report.id}/pdf`}
      />
    </RapportDetailShell>
  );
}
