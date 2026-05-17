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
      return "border border-[#5A9A6A]/35 bg-[#5A9A6A]/10 text-[#5A9A6A]";
    case "advarsel":
      return "border border-[#C4A84F]/35 bg-[#C4A84F]/10 text-[#C4A84F]";
    case "fejl":
      return "border border-[#B85C4A]/35 bg-[#B85C4A]/10 text-[#B85C4A]";
    default:
      return "border border-[#C8D8E4] bg-[#F7F4EF] text-[#4A6478]";
  }
}

function accentBorder(status: MonitoringStatusKey): string {
  switch (status) {
    case "fejl":
      return "border-l-[3px] border-l-[#B85C4A]";
    case "advarsel":
      return "border-l-[3px] border-l-[#C4A84F]";
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
      className={`flex h-full flex-col rounded-2xl border border-[#C8D8E4] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(30,52,72,0.08)] ${accentBorder(status)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#4A7FA5]">
            <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
          </span>
          <h3 className="truncate text-sm font-medium text-[#1E3448]">{friendlyName}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusPillClass(status)}`}
        >
          {status === "ok" ? "OK" : status === "advarsel" ? "!" : status === "fejl" ? "!" : "—"}
        </span>
      </div>

      <p className="mt-4 text-sm text-[#4A6478]">{statusLabel(status)}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <p className="text-xs text-[#7A9AB0]">
          {checkedAgo ? `Tjekket for ${checkedAgo}` : "Ingen seneste tjek"}
        </p>
        {isPending && onSetup ? (
          <button
            type="button"
            onClick={onSetup}
            className="shrink-0 text-xs font-semibold text-[#4A7FA5] transition-colors hover:text-[#3A6F95]"
          >
            Opsæt nu →
          </button>
        ) : onDetails ? (
          <button
            type="button"
            onClick={onDetails}
            className="shrink-0 text-xs font-semibold text-[#4A7FA5] transition-colors hover:text-[#3A6F95]"
          >
            Se detaljer →
          </button>
        ) : (
          <Link
            href="/portal"
            className="shrink-0 text-xs font-semibold text-[#4A7FA5] transition-colors hover:text-[#3A6F95]"
          >
            Se detaljer →
          </Link>
        )}
      </div>
    </article>
  );
}
