import Link from "next/link";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { REPORT_DETAIL_SECTIONS } from "@/lib/reports-queries";
import type { ReportDetailRow } from "@/lib/report-detail-fetch";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="border-b border-slate-100 pb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {body.trim() ? body : <span className="text-slate-400">Ingen indhold.</span>}
      </div>
    </section>
  );
}

type ReportDetailViewProps = {
  report: ReportDetailRow;
  companyName: string | null;
  backHref: string;
  backLabel: string;
};

export function ReportDetailView({ report, companyName, backHref, backLabel }: ReportDetailViewProps) {
  const subtitleParts = [report.period.trim(), companyName?.trim()].filter(Boolean);
  const subtitle = subtitleParts.join(" · ");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="text-sm font-semibold text-emerald-700 hover:underline">
        {backLabel}
      </Link>

      <header className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Månedlig IT-rapport</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{report.title}</h1>
        {subtitle ? <p className="mt-2 text-lg text-slate-700">{subtitle}</p> : null}
        <p className="mt-3 text-sm text-slate-500">Udarbejdet {formatDanishDateTime(report.created_at)}</p>
      </header>

      <div className="mt-8 space-y-6">
        {REPORT_DETAIL_SECTIONS.map(({ field, title }) => (
          <Section key={field} title={title} body={report[field]} />
        ))}
      </div>
    </div>
  );
}
