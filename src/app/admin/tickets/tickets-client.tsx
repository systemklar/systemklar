"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketUnreadCountBadge } from "@/components/tickets/TicketUnreadCountBadge";
import { formatDanishDateTime, StatusBadge } from "@/components/tickets/StatusBadge";
import { companyFromTicketRow, type TicketWithProfileRow } from "@/lib/tickets-with-profile";
import { fetchUnreadMessageCountsByTicket } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export default function AdminTicketsClient() {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<TicketWithProfileRow[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [query, setQuery] = useState("");

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    const res = await fetch("/api/admin/tickets", { credentials: "same-origin" });
    const payload = (await res.json().catch(() => ({}))) as {
      tickets?: TicketWithProfileRow[];
      error?: string;
    };

    if (!res.ok || !payload.tickets) {
      console.error("[admin/tickets] fetch", payload.error ?? res.status);
      setTickets([]);
      setUnreadByTicket({});
    } else {
      setTickets(payload.tickets);
      const unread = await fetchUnreadMessageCountsByTicket(
        supabase,
        payload.tickets.map((t) => t.id),
      );
      setUnreadByTicket(unread);
    }
    setTicketsLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTickets();
    });
  }, [loadTickets]);

  const groupedByCompany = useMemo(() => {
    const map = new Map<string, TicketWithProfileRow[]>();
    for (const t of tickets) {
      const company = companyFromTicketRow(t);
      if (!map.has(company)) {
        map.set(company, []);
      }
      map.get(company)!.push(t);
    }
    return Array.from(map.entries())
      .map(([company, rows]) => ({
        company,
        tickets: rows,
        activeCount: rows.filter((r) => r.status === "active").length,
      }))
      .sort((a, b) => a.company.localeCompare(b.company, "da"));
  }, [tickets]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedByCompany
      .filter((g) => selectedCompany === "all" || g.company === selectedCompany)
      .map((g) => ({
        ...g,
        tickets: g.tickets.filter((t) => {
          if (!q) return true;
          const title = t.title.toLowerCase();
          const company = g.company.toLowerCase();
          return title.includes(q) || company.includes(q);
        }),
      }))
      .filter((g) => g.tickets.length > 0);
  }, [groupedByCompany, selectedCompany, query]);

  const totalFiltered = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.tickets.length, 0),
    [filteredGroups],
  );

  const totalActive = useMemo(
    () => tickets.filter((t) => t.status === "active").length,
    [tickets],
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D] md:text-3xl">Support & sager</h1>
        <p className="mt-2 text-sm text-slate-600">Tickets grupperet per kunde.</p>
      </div>

      {ticketsLoading ? (
        <p className="mt-8 text-sm text-[#4A8CB5]">Henter tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ingen tickets.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#D0E8F5] bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Kunder</p>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCompany("all")}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${
                  selectedCompany === "all" ? "bg-blue-50 text-blue-700" : "hover:bg-[#F5FAFD]"
                }`}
              >
                <span>Alle sager</span>
                <span className="text-xs font-semibold">{totalActive} aktive</span>
              </button>
              {groupedByCompany.map((group) => (
                <button
                  key={group.company}
                  type="button"
                  onClick={() => setSelectedCompany(group.company)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${
                    selectedCompany === group.company ? "bg-blue-50 text-blue-700" : "hover:bg-[#F5FAFD]"
                  }`}
                >
                  <span className="truncate">{group.company}</span>
                  <span className="ml-2 shrink-0 text-xs font-semibold">{group.activeCount} aktive</span>
                </button>
              ))}
            </div>
          </aside>

          <section>
            <div className="rounded-2xl border border-[#D0E8F5] bg-white p-4 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Søg</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer på kundenavn eller sagsnavn..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:text-sm"
              />
            </div>

            {totalFiltered === 0 ? (
              <p className="mt-6 text-sm text-slate-600">Ingen sager matcher filteret.</p>
            ) : (
              <div className="mt-6 space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.company} className="overflow-hidden rounded-2xl border border-[#D0E8F5] bg-white shadow-sm">
                    <div className="border-b border-[#D0E8F5] bg-[#F5FAFD] px-5 py-3">
                      <p className="font-semibold text-[#0D1F2D]">{group.company}</p>
                      <p className="text-xs text-[#4A8CB5]">{group.tickets.length} sager</p>
                    </div>
                    <ul className="divide-y divide-slate-200">
                      {group.tickets.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/admin/tickets/${t.id}`}
                            className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[#F5FAFD] md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-[#0D1F2D]">{t.title}</p>
                                <TicketUnreadCountBadge count={unreadByTicket[t.id] ?? 0} />
                              </div>
                              <p className="mt-0.5 text-sm text-[#4A8CB5]">{formatDanishDateTime(t.created_at)}</p>
                            </div>
                            <StatusBadge status={t.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
