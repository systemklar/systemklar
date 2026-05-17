"use client";

import { useState } from "react";
import { normalizeTicketStatus, StatusBadge } from "@/components/tickets/StatusBadge";

type Props = {
  ticketId: string;
  status: string;
  onUpdated: (next: string) => void;
};

export function TicketStatusToggle({ ticketId, status, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = normalizeTicketStatus(status);
  const nextStatus = current === "active" ? "resolved" : "active";

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: nextStatus }),
    });

    setBusy(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Kunne ikke opdatere status.");
      return;
    }

    onUpdated(nextStatus);
  };

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <StatusBadge status={current} />
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        className="rounded-full border border-[#CBD5E8] bg-white px-4 py-2 text-sm font-semibold text-[#1E4490] shadow-sm transition hover:bg-[#E8EEFC] focus:outline-none focus:ring-2 focus:ring-[#2952A3] disabled:opacity-50"
      >
        {busy
          ? "Opdaterer..."
          : current === "active"
            ? "Marker som løst"
            : "Marker som aktiv"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
