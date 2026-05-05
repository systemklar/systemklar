"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  fetchTicketWithProfileForUser,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { TicketStatusToggle } from "@/components/tickets/TicketStatusToggle";
import { TicketMessageThread } from "@/components/tickets/TicketMessageThread";
import { setTicketLastViewedToNow } from "@/lib/ticket-last-viewed";
import { fetchCompanyNameForUser } from "@/lib/profile-customer";
import { createClient } from "@/lib/supabase";

export default function PortalSupportTicketPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [ticket, setTicket] = useState<TicketWithProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    if (!id) {
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const row = await fetchTicketWithProfileForUser(supabase, id, user.id);
    const ownCompanyName = await fetchCompanyNameForUser(supabase, user.id);
    setCompanyName(ownCompanyName);

    if (!row) {
      console.error("[ticket] load failed");
      router.replace("/portal/support");
      setLoading(false);
      return;
    }

    setTicket(row);
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTicket();
    });
  }, [loadTicket]);

  useEffect(() => {
    if (!ticket?.id) return;
    setTicketLastViewedToNow(ticket.id);
  }, [ticket?.id]);

  const handleDelete = async () => {
    if (!ticket || !confirm("Er du sikker på, at du vil slette denne sag?")) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    setDeleting(true);
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticket.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[ticket] delete", error);
      setDeleting(false);
      return;
    }

    router.replace("/portal/support");
  };

  if (loading || !ticket) {
    return (
      <PortalLayout activeNav="support">
        <p className="text-slate-600">Indlæser sag...</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout activeNav="support">
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col md:h-[calc(100vh-9rem)]">
        <Link
          href="/portal/support"
          className="text-sm font-semibold hover:underline"
          style={{ color: "#1D9E75" }}
        >
          ← Tilbage til Support & sager
        </Link>

        <header className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
              {companyName ? (
                <p className="mt-2 text-sm font-medium text-slate-700">{companyName}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-500">
                Oprettet {formatDanishDateTime(ticket.created_at)}
              </p>
            </div>
            <TicketStatusToggle
              ticketId={ticket.id}
              status={ticket.status}
              onUpdated={(next) =>
                setTicket((t) => (t ? { ...t, status: next } : null))
              }
            />
          </div>
          {ticket.description ? (
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{ticket.description}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Ingen beskrivelse.</p>
          )}

          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="mt-6 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Sletter..." : "Slet sag"}
          </button>
        </header>

        <div className="mt-4 min-h-0 flex-1">
          <TicketMessageThread
            ticketId={ticket.id}
            sendAsAdmin={false}
            customerCompanyLabel={companyName ?? "Kunde"}
            fullHeight
          />
        </div>
      </div>
    </PortalLayout>
  );
}
