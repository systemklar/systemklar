"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MonitoringStatusKey } from "@/lib/monitoring/monitoring-dashboard-copy";

function statusLabel(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "Fungerer";
    case "advarsel":
      return "Kræver opmærksomhed";
    case "fejl":
      return "Virker ikke";
    default:
      return "Afventer opsætning";
  }
}

function statusPillClass(status: MonitoringStatusKey): string {
  switch (status) {
    case "ok":
      return "border border-[#22C78A]/35 bg-[#22C78A]/10 text-[#22C78A]";
    case "advarsel":
      return "border border-[#F0A030]/35 bg-[#F0A030]/10 text-[#F0A030]";
    case "fejl":
      return "border border-[#E05040]/35 bg-[#E05040]/10 text-[#E05040]";
    default:
      return "border border-[#CBD5E8] bg-[#F2F5FA] text-[#2A4868]";
  }
}

function accentBorder(status: MonitoringStatusKey): string {
  switch (status) {
    case "fejl":
      return "border-l-[3px] border-l-[#E05040]";
    case "advarsel":
      return "border-l-[3px] border-l-[#F0A030]";
    default:
      return "";
  }
}

type PortalSystemCardProps = {
  friendlyName: string;
  Icon: LucideIcon;
  status: MonitoringStatusKey;
  checkedAgo: string | null;
  onSetup?: () => void;
  onDetails?: () => void;
};

export function PortalSystemCard({
  friendlyName,
  Icon,
  status,
  checkedAgo,
  onSetup,
  onDetails,
}: PortalSystemCardProps) {
  const isPending = status === "afventer";

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border border-[#CBD5E8] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,22,40,0.08)] ${accentBorder(status)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#2952A3]">
            <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
          </span>
          <h3 className="truncate text-sm font-medium text-[#0A1628]">{friendlyName}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusPillClass(status)}`}
        >
          {status === "ok" ? "OK" : status === "advarsel" ? "!" : status === "fejl" ? "!" : "—"}
        </span>
      </div>

      <p className="mt-4 text-sm text-[#2A4868]">{statusLabel(status)}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <p className="text-xs text-[#6A82A8]">
          {checkedAgo ? `Tjekket for ${checkedAgo}` : "Ingen seneste tjek"}
        </p>
        {isPending && onSetup ? (
          <button
            type="button"
            onClick={onSetup}
            className="shrink-0 text-xs font-semibold text-[#2952A3] transition-colors hover:text-[#1E4490]"
          >
            Opsæt nu →
          </button>
        ) : onDetails ? (
          <button
            type="button"
            onClick={onDetails}
            className="shrink-0 text-xs font-semibold text-[#2952A3] transition-colors hover:text-[#1E4490]"
          >
            Se detaljer →
          </button>
        ) : (
          <Link
            href="/portal"
            className="shrink-0 text-xs font-semibold text-[#2952A3] transition-colors hover:text-[#1E4490]"
          >
            Se detaljer →
          </Link>
        )}
      </div>
    </article>
  );
}
