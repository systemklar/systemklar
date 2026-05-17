"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { usePortalSession } from "@/components/portal/PortalLayout";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { SystemklarMark } from "@/components/SystemklarMark";
import { createClient } from "@/lib/supabase";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const SUGGESTIONS = [
  "Hvad overvåger I?",
  "Hvordan opsætter jeg e-conomic?",
  "Hvad er min systemstatus?",
  "Hjælp mig med en IT-sag",
] as const;

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6A82A8] [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6A82A8] [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6A82A8]" />
    </span>
  );
}

function ClaudeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border border-[#CBD5E8] bg-[#F2F5FA] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6A82A8] ${className}`.trim()}
    >
      Drevet af Claude
    </span>
  );
}

export default function PortalAiAssistantPage() {
  const supabase = useMemo(() => createClient(), []);
  const session = usePortalSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const showWelcome = messages.length === 0 && !loading;

  useEffect(() => {
    queueMicrotask(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (!authSession?.user || cancelled) return;
      setBootstrapped(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const nextUser: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const updatedMessages = [...messages, nextUser];
    setMessages(updatedMessages);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          messages: updatedMessages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        answer?: string;
        error?: string;
      };

      if (!res.ok || !payload.answer) {
        setError(payload.error ?? "Kunne ikke få svar fra AI-assistenten.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.answer!.trim(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  const userInitials = session?.avatarInitials ?? "DU";

  return (
    <PortalPageShell
      title="AI-assistent"
      subtitle="Din IT-rådgiver — spørgsmål om systemer, support og rapporter"
      action={<ClaudeBadge />}
    >
      <div className="flex h-[min(calc(100dvh-12rem),52rem)] flex-col overflow-hidden rounded-2xl border border-[#CBD5E8] bg-white shadow-sm">
        <header className="flex shrink-0 items-center gap-3 border-b border-[#CBD5E8] bg-white px-5 py-4">
          <SystemklarMark size={36} variant="avatar" />
          <div>
            <p className="text-sm font-semibold text-[#0A1628]">Systemklar AI</p>
            <p className="text-xs text-[#6A82A8]">Online</p>
          </div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-y-auto bg-[#F2F5FA]/50 px-4 py-6 md:px-6">
          {showWelcome && bootstrapped ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <SystemklarMark size={48} />
              <h2 className="mt-6 text-xl font-light text-[#0A1628]">Hej, jeg er din IT-assistent</h2>
              <p className="mt-2 max-w-md text-sm text-[#2A4868]">
                Stil mig spørgsmål om din IT, systemer eller support
              </p>
              <div className="mt-8 flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendMessage(q)}
                    disabled={loading}
                    className="rounded-full border border-[#CBD5E8] bg-white px-4 py-2 text-xs font-medium text-[#2A4868] transition hover:border-[#2952A3] hover:text-[#0A1628] disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {message.role === "assistant" ? (
                    <SystemklarMark size={32} variant="avatar" className="mt-1" />
                  ) : (
                    <ProfileAvatar
                      avatarUrl={session?.avatarUrl}
                      initials={userInitials}
                      className="mt-1 h-8 w-8 shrink-0 text-xs"
                      variant="brand"
                    />
                  )}
                  <div
                    className={`max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6A82A8]">
                      {message.role === "user" ? "Dig" : "Systemklar AI"}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "rounded-br-md bg-[#2952A3] text-white"
                          : "rounded-bl-md border border-[#CBD5E8] bg-white text-[#0A1628]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </li>
              ))}
              {loading ? (
                <li className="flex gap-3">
                  <SystemklarMark size={32} variant="avatar" className="mt-1" />
                  <div>
                    <p className="mb-1 text-[10px] font-semibold text-[#6A82A8]">Systemklar AI</p>
                    <div className="rounded-2xl rounded-bl-md border border-[#CBD5E8] bg-white px-4 py-3 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                </li>
              ) : null}
            </ul>
          )}
          <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
        </section>

        <footer className="shrink-0 border-t border-[#CBD5E8] bg-white px-4 py-4 md:px-5">
          {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}
          <form onSubmit={(e) => void handleSubmit(e)} className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(draft);
                }
              }}
              rows={1}
              placeholder="Skriv din besked..."
              className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-[#CBD5E8] px-4 py-2.5 text-sm text-[#0A1628] outline-none transition focus:border-[#2952A3] focus:ring-2 focus:ring-[#2952A3]/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2952A3] text-white transition hover:bg-[#1E4490] disabled:opacity-50"
              aria-label="Send besked"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </footer>
      </div>
    </PortalPageShell>
  );
}
