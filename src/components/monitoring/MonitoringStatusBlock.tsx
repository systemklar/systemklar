"use client";

export type MonitoringResultRow = {
  system_name: string;
  status: string;
  checked_at: string;
  details?: Record<string, unknown>;
};

export function monitoringResultsBySystemName(rows: MonitoringResultRow[] | null): Map<string, MonitoringResultRow> {
  const sorted = [...(rows ?? [])].sort(
    (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime(),
  );
  const m = new Map<string, MonitoringResultRow>();
  for (const r of sorted) {
    if (!m.has(r.system_name)) m.set(r.system_name, r);
  }
  return m;
}

export function formatCheckedAgoDa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "Planlagt tjek";
  const minutes = Math.floor(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("da", { numeric: "auto" });
  if (minutes < 1) return "Tjekket for under et minut siden";
  if (minutes < 60) return `Tjekket ${rtf.format(-minutes, "minute")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Tjekket ${rtf.format(-hours, "hour")}`;
  const days = Math.floor(hours / 24);
  return `Tjekket ${rtf.format(-days, "day")}`;
}

const STATUS_PILL: Record<string, string> = {
  ok: "bg-green-100 text-green-800",
  advarsel: "bg-amber-100 text-amber-900",
  fejl: "bg-red-100 text-red-800",
  afventer: "bg-slate-100 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "OK",
  advarsel: "Advarsel",
  fejl: "Fejl",
  afventer: "Afventer opsætning",
};

type MonitoringStatusBlockProps = {
  systemName: string;
  /** Seneste række for dette systemnavn, hvis nogen. */
  row?: MonitoringResultRow | null;
};

export function MonitoringStatusBlock({ systemName, row }: MonitoringStatusBlockProps) {
  const status = (row?.status ?? "afventer").toLowerCase();
  const pillClass = STATUS_PILL[status] ?? STATUS_PILL.afventer;
  const label = STATUS_LABEL[status] ?? STATUS_LABEL.afventer;
  const checked = row?.checked_at ? formatCheckedAgoDa(row.checked_at) : null;

  return (
    <div className="mt-auto flex flex-col gap-1 pt-5">
      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass}`}
        title={systemName}
      >
        {label}
      </span>
      {checked ? <span className="text-[11px] text-slate-400">{checked}</span> : null}
    </div>
  );
}

export function MonitoringStatusInline({ systemName, row }: MonitoringStatusBlockProps) {
  const status = (row?.status ?? "afventer").toLowerCase();
  const pillClass = STATUS_PILL[status] ?? STATUS_PILL.afventer;
  const label = STATUS_LABEL[status] ?? STATUS_LABEL.afventer;
  const checked = row?.checked_at ? formatCheckedAgoDa(row.checked_at) : null;

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass}`}
        title={systemName}
      >
        {label}
      </span>
      {checked ? <span className="max-w-[10rem] text-[11px] text-slate-400">{checked}</span> : null}
    </div>
  );
}
