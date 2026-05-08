"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { createClient } from "@/lib/supabase";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const QUICK_QUESTIONS = [
  "Hvad er status på mine systemer?",
  "Hvad stod der i min seneste IT-rapport?",
  "Jeg har et problem med et system",
  "Opret en ny sag",
];

function RobotIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200" aria-hidden>
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-slate-600">
        <rect x="4" y="6" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 4v2M7.5 10h.01M12.5 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle" aria-hidden>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5FAFD]0 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5FAFD]0 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5FAFD]0" />
    </span>
  );
}

export default function PortalAiAssistantPage() {
  const supabase = useMemo(() => createClient(), []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [companyName, setCompanyName] = useState<string>("kunde");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const name = data?.company_name?.trim() || "kunde";
      if (cancelled) return;

      setCompanyName(name);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Hej ${name}! Jeg er din IT-assistent. Hvad kan jeg hjælpe dig med?`,
        },
      ]);
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

      const nextAssistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.answer.trim(),
      };
      setMessages((prev) => [...prev, nextAssistant]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  return (
    <PortalLayout activeNav="ai">
      <div className="card-hover mx-auto flex h-[calc(100vh-8rem)] w-full max-w-4xl flex-col rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
        <header className="shrink-0 border-b border-[#E7E5E4] px-5 py-4">
          <h1 className="text-xl font-bold text-[#1C1917]">AI-assistent</h1>
          <p className="mt-1 text-sm text-[#78716C]">
            Stil spørgsmål om dine systemer, sager og seneste rapport.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendMessage(question)}
                disabled={loading}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </header>

        <section className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F5FAFD]/60 px-5 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md border border-[#D0E8F5] bg-white text-[#0D1F2D]"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <RobotIcon />
                    AI-assistent
                  </div>
                ) : null}
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[#D0E8F5] bg-white px-4 py-3 text-sm text-[#2C4A5E] shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <RobotIcon />
                  AI-assistent
                </div>
                <span>
                  AI-assistenten skriver... <TypingDots />
                </span>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} className="h-px w-full shrink-0 scroll-mt-4" aria-hidden />
        </section>

        <footer className="shrink-0 border-t border-[#E7E5E4] bg-white px-4 py-3">
          {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}
          <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Skriv til AI-assistenten hos ${companyName}...`}
              className="min-w-0 flex-1 rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </footer>
      </div>
    </PortalLayout>
  );
}
