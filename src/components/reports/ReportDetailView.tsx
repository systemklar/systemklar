import Link from "next/link";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { REPORT_DETAIL_SECTIONS } from "@/lib/reports-queries";
import type { ReportDetailRow } from "@/lib/report-detail-fetch";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-[#CBD5E8] bg-white p-6 shadow-sm">
      <h2 className="border-b border-[#E4EAF5] pb-3 text-lg font-semibold text-[#0A1628]">{title}</h2>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#2A4868]">
        {body.trim() ? body : <span className="text-[#9AAAC8]">Ingen indhold.</span>}
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

      <header className="mt-6 rounded-2xl border border-[#CBD5E8] bg-gradient-to-b from-white to-[#F2F5FA]/80 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Månedlig IT-rapport</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A1628]">{report.title}</h1>
        {subtitle ? <p className="mt-2 text-lg text-[#2A4868]">{subtitle}</p> : null}
        <p className="mt-3 text-sm text-[#6A82A8]">Udarbejdet {formatDanishDateTime(report.created_at)}</p>
      </header>

      <div className="mt-8 space-y-6">
        {REPORT_DETAIL_SECTIONS.map(({ field, title }) => (
          <Section key={field} title={title} body={report[field]} />
        ))}
      </div>
    </div>
  );
}
