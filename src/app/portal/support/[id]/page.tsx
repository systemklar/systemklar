"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketDetailLayout } from "@/components/tickets/TicketDetailLayout";
import {
  fetchTicketWithProfileForUser,
  type TicketWithProfileRow,
} from "@/lib/tickets-with-profile";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { setTicketLastViewedToNow } from "@/lib/ticket-last-viewed";
import { createClient } from "@/lib/supabase";

export default function PortalSupportTicketPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [ticket, setTicket] = useState<TicketWithProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [companyName, setCompanyName] = useState<string>("Kunde");

  const loadTicket = useCallback(async () => {
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

    const profile = await fetchCurrentProfile(supabase, user.id);
    if (!profile?.organisation_id) {
      router.replace("/portal/support");
      setLoading(false);
      return;
    }
    const row = await fetchTicketWithProfileForUser(supabase, id, profile.organisation_id);
    setCompanyName(profile.company_name?.trim() || "Kunde");

    if (!row) {
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
    const profile = await fetchCurrentProfile(supabase, user.id);
    if (!profile?.organisation_id) return;

    setDeleting(true);
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticket.id)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("[ticket] delete", error);
      setDeleting(false);
      return;
    }

    router.replace("/portal/support");
  };

  if (loading || !ticket) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-[#2A4868]">Indlæser sag…</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <TicketDetailLayout
        ticket={ticket}
        backHref="/portal/support"
        customerName={companyName}
        sendAsAdmin={false}
        showExpectedResponse
        onStatusChange={(next) => setTicket((t) => (t ? { ...t, status: next } : null))}
        sidebarFooter={
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="w-full rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Sletter…" : "Slet sag"}
          </button>
        }
      />
    </div>
  );
}
