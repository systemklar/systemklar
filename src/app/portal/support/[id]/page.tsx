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
import { AttachmentList } from "@/components/ui/AttachmentList";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { setTicketLastViewedToNow } from "@/lib/ticket-last-viewed";
import { normalizeTicketAttachmentRow, type TicketAttachment } from "@/lib/ticket-attachments";
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
  const [ticketLevelAttachments, setTicketLevelAttachments] = useState<TicketAttachment[]>([]);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    if (!id) {
      setTicketLevelAttachments([]);
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
    setCompanyName(profile.company_name ?? null);

    if (!row) {
      console.error("[ticket] load failed");
      setTicketLevelAttachments([]);
      router.replace("/portal/support");
      setLoading(false);
      return;
    }

    setTicket(row);
    setLoading(false);

    const { data: attData } = await supabase
      .from("attachments")
      .select(
        "id, ticket_id, message_id, organisation_id, uploaded_by, file_name, file_size, file_type, storage_path, created_at",
      )
      .eq("ticket_id", row.id)
      .is("message_id", null)
      .order("created_at", { ascending: true });
    const atts = (attData ?? [])
      .map((r) => normalizeTicketAttachmentRow(r as Record<string, unknown>))
      .filter((a): a is TicketAttachment => a !== null);
    setTicketLevelAttachments(atts);
  }, [id, router, supabase]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUserId(session?.user?.id ?? null);
    });
  }, [supabase]);

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
      <PortalLayout activeNav="support">
        <p className="text-sm text-[#4A8CB5]">Indlæser sag...</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout activeNav="support">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href="/portal/support" className="text-sm font-semibold text-sky-600 hover:underline">
          ← Tilbage til Support & sager
        </Link>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-3">
          <div className="min-h-[60vh] lg:col-span-2">
            <TicketMessageThread
              ticketId={ticket.id}
              organisationId={ticket.organisation_id}
              sendAsAdmin={false}
              customerCompanyLabel={companyName ?? "Kunde"}
              fullHeight
            />
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Sag-info</p>
              <div className="border-b border-sky-50 py-2">
                <p className="text-xs text-[#4A8CB5]">Titel</p>
                <h1 className="mt-1 text-base font-semibold text-[#0D1F2D]">{ticket.title}</h1>
              </div>
              {companyName ? (
                <div className="border-b border-sky-50 py-2">
                  <p className="text-xs text-[#4A8CB5]">Virksomhed</p>
                  <p className="mt-1 text-sm text-[#0D1F2D]">{companyName}</p>
                </div>
              ) : null}
              <div className="border-b border-sky-50 py-2">
                <p className="text-xs text-[#4A8CB5]">Oprettet</p>
                <p className="mt-1 text-sm text-[#0D1F2D]">{formatDanishDateTime(ticket.created_at)}</p>
              </div>
              <div className="py-2">
                <p className="mb-2 text-xs text-[#4A8CB5]">Status</p>
            <TicketStatusToggle
              ticketId={ticket.id}
              status={ticket.status}
              onUpdated={(next) =>
                setTicket((t) => (t ? { ...t, status: next } : null))
              }
            />
              </div>
            </section>

            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Beskrivelse</p>
          {ticket.description ? (
                <p className="whitespace-pre-wrap text-sm text-[#2C4A5E]">{ticket.description}</p>
          ) : (
                <p className="text-sm text-[#4A8CB5]">Ingen beskrivelse.</p>
          )}
            </section>

          {ticketLevelAttachments.length > 0 ? (
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">Vedhæftninger</p>
              <AttachmentList
                attachments={ticketLevelAttachments}
                showDelete
                canDelete={(a) => (authUserId ? a.uploaded_by === authUserId : false)}
                onDelete={(removedId) =>
                  setTicketLevelAttachments((prev) => prev.filter((x) => x.id !== removedId))
                }
              />
            </section>
          ) : null}

          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Sletter..." : "Slet sag"}
          </button>
          </aside>
        </div>
      </div>
    </PortalLayout>
  );
}
