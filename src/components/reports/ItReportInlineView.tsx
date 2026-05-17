"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import {
  buildItReportHtmlDocument,
  parseItReportContent,
  periodLabelDa,
} from "@/lib/it-reports";
import type { PortalItReportRow } from "@/lib/it-report-portal-fetch";

type ItReportInlineViewProps = {
  report: PortalItReportRow;
  backHref: string;
  backLabel: string;
  pdfHref: string;
};

export function ItReportInlineView({ report, backHref, backLabel, pdfHref }: ItReportInlineViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const content = useMemo(() => parseItReportContent(report.content), [report.content]);
  const periodLabel = periodLabelDa(report.period_start, report.period_end);

  const previewHtml = useMemo(() => {
    if (!content) return "";
    return buildItReportHtmlDocument({
      organisationName: content.organisationName,
      periodLabel,
      aiSummary: report.ai_summary ?? "",
      aiRecommendations: report.ai_recommendations ?? "",
      content,
      forPrint: false,
    });
  }, [content, periodLabel, report.ai_recommendations, report.ai_summary]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !previewHtml) return;
    el.srcdoc = previewHtml;
  }, [previewHtml]);

  if (!content) {
    return (
      <div>
        <Link href={backHref} className="text-sm font-semibold text-[#2952A3] hover:underline">
          {backLabel}
        </Link>
        <p className="mt-6 text-sm text-[#2A4868]">Rapportindholdet kunne ikke vises.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={backHref} className="text-sm font-semibold text-[#2952A3] hover:underline">
          {backLabel}
        </Link>
        <a
          href={pdfHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#CBD5E8] bg-white px-4 py-2.5 text-sm font-semibold text-[#0A1628] shadow-sm transition hover:bg-[#F2F5FA]"
        >
          <FileDown className="h-4 w-4 text-[#2952A3]" aria-hidden />
          Download som PDF
        </a>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A1628]">{report.title}</h1>
        <p className="mt-1 text-sm text-[#2A4868]">{periodLabel}</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#CBD5E8] bg-[#F2F5FA] shadow-sm">
        <iframe
          ref={iframeRef}
          title={report.title}
          className="h-[min(920px,80vh)] w-full bg-white"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
