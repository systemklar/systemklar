"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PostgrestError, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { companyFromTicketRow, fetchTicketWithProfileById } from "@/lib/tickets-with-profile";
import { createClient } from "@/lib/supabase";
import { formatDanishDateTime } from "./StatusBadge";

export type MessageRow = {
  id: string;
  ticket_id: string;
  user_id: string;
  sender_name: string | null;
  sender_role: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
};

/** REST/realtime kan returnere bool som string eller null – normaliser til boolean. */
function parseIsAdmin(value: unknown): boolean {
  if (value === true || value === "true" || value === "t" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === "f" || value === 0 || value === "0") {
    return false;
  }
  return false;
}

function normalizeMessageRow(raw: Record<string, unknown>): MessageRow | null {
  const id = raw.id;
  const ticket_id = raw.ticket_id;
  const content = raw.content;
  if (typeof id !== "string" || typeof ticket_id !== "string" || typeof content !== "string") {
    return null;
  }
  const user_id = typeof raw.user_id === "string" ? raw.user_id : "";
  const sender_name = typeof raw.sender_name === "string" ? raw.sender_name : null;
  const sender_role = typeof raw.sender_role === "string" ? raw.sender_role : null;
  const created_at = typeof raw.created_at === "string" ? raw.created_at : "";
  return {
    id,
    ticket_id,
    user_id,
    sender_name,
    sender_role,
    content,
    is_admin: parseIsAdmin(raw.is_admin),
    created_at,
  };
}

type TicketMessageThreadProps = {
  ticketId: string;
  /** Kunde: false. Admin-svar: true. */
  sendAsAdmin: boolean;
  /**
   * Admin: firmanavn fra API (service role / korrekt profil-kobling).
   * Udeladt på portalen → hentes via klientens ticket+profil.
   */
  customerCompanyLabel?: string;
  /** Bruges på portalens detaljeside for at lade tråden udfylde resten af viewporten. */
  fullHeight?: boolean;
};

/** Viser en konkret fejltekst – også når Supabase returnerer et næsten tomt fejl-objekt. */
function formatSupabaseError(error: PostgrestError | Error | null): string {
  if (!error) {
    return "Ukendt fejl (null).";
  }

  if ("message" in error && typeof error.message === "string" && error.message.trim()) {
    const pg = error as PostgrestError;
    const bits = [
      pg.message.trim(),
      pg.details && String(pg.details).trim() ? `Detaljer: ${pg.details}` : "",
      pg.hint && String(pg.hint).trim() ? `Hint: ${pg.hint}` : "",
      pg.code ? `Kode: ${pg.code}` : "",
    ].filter(Boolean);
    if (bits.length) {
      return bits.join(" ");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  try {
    const s = JSON.stringify(error);
    if (s && s !== "{}") {
      return s;
    }
  } catch {
    /* ignore */
  }

  return `Fejl uden besked (${Object.prototype.toString.call(error)}). Tjek browserkonsollen og Supabase RLS/skema.`;
}

function sortMessages(rows: MessageRow[]) {
  return [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5" aria-hidden>
      <span className="ticket-typing-dot" />
      <span className="ticket-typing-dot" />
      <span className="ticket-typing-dot" />
    </span>
  );
}

export function TicketMessageThread({
  ticketId,
  sendAsAdmin,
  customerCompanyLabel,
  fullHeight = false,
}: TicketMessageThreadProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [customerSenderLabel, setCustomerSenderLabel] = useState("Kunde");
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (customerCompanyLabel !== undefined) {
      const trimmed = customerCompanyLabel.trim();
      setCustomerSenderLabel(trimmed || "Kunde");
      return;
    }
    let cancelled = false;
    const run = async () => {
      const row = await fetchTicketWithProfileById(supabase, ticketId);
      if (cancelled) return;
      setCustomerSenderLabel(row ? companyFromTicketRow(row) : "Kunde");
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [ticketId, supabase, customerCompanyLabel]);

  const appendMessage = useCallback(
    (raw: Record<string, unknown>) => {
      const row = normalizeMessageRow(raw);
      if (!row || row.ticket_id !== ticketId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) {
          return prev;
        }
        return sortMessages([...prev, row]);
      });
    },
    [ticketId],
  );

  const loadMessages = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("messages")
      .select("id, ticket_id, user_id, sender_name, sender_role, content, is_admin, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      const msg = formatSupabaseError(error);
      console.error("[messages] fetch", { raw: error, formatted: msg });
      setFetchError(msg);
      setMessages([]);
    } else {
      setFetchError(null);
      const rows = (data ?? [])
        .map((r) => normalizeMessageRow(r as Record<string, unknown>))
        .filter((m): m is MessageRow => m !== null);
      setMessages(sortMessages(rows));
    }
    setLoading(false);
  }, [ticketId, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages();
    });
  }, [loadMessages]);

  useEffect(() => {
    if (!ticketId) return;

    const channelName = `messages:ticket:${ticketId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          const raw = payload.new;
          if (!raw || typeof raw !== "object") return;
          appendMessage(raw as Record<string, unknown>);
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.info("[messages] realtime subscribed", channelName);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[messages] realtime", status, err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId, appendMessage, supabase]);

  useEffect(() => {
    if (!ticketId) return;

    const channelName = `ticket-typing-${ticketId}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "typing" }, (payload) => {
        const incomingIsAdmin = parseIsAdmin((payload.payload as { is_admin?: unknown })?.is_admin);

        // Vis kun typing-indikator for modparten.
        if (incomingIsAdmin === sendAsAdmin) return;

        setShowTypingIndicator(true);
        if (typingTimeoutRef.current !== null) {
          window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
          setShowTypingIndicator(false);
          typingTimeoutRef.current = null;
        }, 3000);
      })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[typing] realtime", status, err);
        }
      });
    typingChannelRef.current = channel;

    return () => {
      typingChannelRef.current = null;
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [ticketId, sendAsAdmin, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages]);

  const maybeBroadcastTyping = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < 1000) return; // max 1 event/sek
    lastTypingSentAtRef.current = now;

    if (!typingChannelRef.current) return;
    await typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { is_admin: sendAsAdmin },
    });
  }, [sendAsAdmin]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    const senderNameFromAuth = user
      ? (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name.trim()
          : user.email?.trim() || (sendAsAdmin ? "Admin" : customerSenderLabel))
      : (sendAsAdmin ? "Admin" : customerSenderLabel);
    let senderName = senderNameFromAuth;
    if (!sendAsAdmin) {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        const fullName = profile?.full_name as string | undefined;
        if (fullName?.trim()) senderName = fullName.trim();
      }
    }

    if (!user) {
      setSendError("Du er ikke logget ind.");
      return;
    }

    setSending(true);
    setSendError(null);
    setShowTypingIndicator(false);

    const { error } = await supabase.from("messages").insert({
      ticket_id: ticketId,
      user_id: user.id,
      content: text,
      is_admin: sendAsAdmin,
      sender_name: senderName,
      sender_role: sendAsAdmin ? "admin" : "customer",
    });

    if (error) {
      const msg = formatSupabaseError(error);
      console.error("[messages] insert", { raw: error, formatted: msg });
      setSendError(msg);
    } else {
      setSendError(null);
      setDraft("");
      await loadMessages();
    }
    setSending(false);
  };

  /** Admin-skærm: egne udkast til højre (Systemklar). Kundeportal: til venstre (DIG). */
  const typingOnRight = sendAsAdmin;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm ${
        fullHeight
          ? "h-full min-h-0"
          : "mt-8 h-[min(28rem,calc(100vh-14rem))] min-h-[20rem] max-h-[32rem] sm:h-[32rem] sm:max-h-[36rem]"
      }`}
    >
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <h2 className="text-lg font-semibold">Beskeder</h2>
      </div>

      {fetchError && (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Kunne ikke hente beskeder</p>
          <p className="mt-1 break-words font-mono text-xs leading-relaxed">{fetchError}</p>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-4 py-4">
        {loading ? (
          <p className="text-sm text-slate-500">Indlæser beskeder...</p>
        ) : fetchError ? null : messages.length === 0 && !showTypingIndicator ? (
          <p className="text-sm text-slate-500">Ingen beskeder endnu.</p>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex w-full flex-col ${
                  m.sender_role === "customer" ? "items-end" : "items-start"
                }`}
              >
                <div className="mb-1 text-xs text-[#4A8CB5]">
                  {(m.sender_name?.trim() || (m.sender_role === "customer" ? customerSenderLabel : "Systemklar"))} ·{" "}
                  {formatDanishDateTime(m.created_at)}
                </div>
                <div
                  className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    m.sender_role === "customer"
                      ? "rounded-br-md border border-blue-200 bg-blue-50 text-slate-900"
                      : "rounded-bl-md bg-slate-700 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {showTypingIndicator && (
              <div
                className={`flex w-full flex-col ${typingOnRight ? "items-end" : "items-start"}`}
              >
                <span
                  className={`mb-1 block max-w-[14rem] truncate text-xs font-semibold ${
                    typingOnRight
                      ? "uppercase tracking-wide text-slate-500"
                      : "normal-case tracking-normal text-blue-600"
                  }`}
                >
                  {typingOnRight ? "Systemklar" : customerSenderLabel}
                </span>
                <div
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                    typingOnRight
                      ? "rounded-br-md bg-slate-600 text-white"
                      : "rounded-bl-md border border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  <span>Skriver</span>
                  <TypingDots />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} className="h-px w-full shrink-0 scroll-mt-4" aria-hidden />
      </div>

      {sendError && (
        <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Kunne ikke sende besked</p>
          <p className="mt-1 break-words font-mono text-xs leading-relaxed">{sendError}</p>
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (sendError) setSendError(null);
            if (next.trim()) {
              void maybeBroadcastTyping();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Skriv en besked..."
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend()}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {sending ? "Sender..." : "Send"}
        </button>
      </div>
    </div>
  );
}
