"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDkk, serviceUnitLabel } from "@/lib/service-units";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type ServiceRow = { id: string; name: string; description: string | null; price: string | number; unit: string };

export default function PortalQuoteNewPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [needs, setNeeds] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const sRes = await supabase.from("services").select("id, name, description, price, unit").order("name");
      if (cancelled) return;
      if (sRes.error) {
        logSupabaseError("[portal/tilbud/new] services", sRes.error);
        setLoadError(sRes.error.message);
      } else {
        setServices((sRes.data ?? []) as ServiceRow[]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const toggleService = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selected.size === 0) {
      setActionError("Vælg mindst én tjeneste.");
      return;
    }
    setGenerating(true);
    setActionError(null);
    const res = await fetch("/api/portal/quotes/generate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceIds: [...selected],
        needsDescription: needs,
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      content?: string;
      suggestedTitle?: string;
      error?: string;
    };
    setGenerating(false);
    if (!res.ok) {
      setActionError(payload.error ?? "Generering fejlede.");
      return;
    }
    if (payload.content) setContent(payload.content);
    if (payload.suggestedTitle && !title.trim()) setTitle(payload.suggestedTitle);
  };

  const saveDraft = async (): Promise<string | null> => {
    const email = recipientEmail.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      setActionError("Angiv en gyldig modtager-email.");
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setActionError("Session udløbet. Log ind igen.");
      return null;
    }

    const t = title.trim() || `Tilbud — ${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date())}`;
    const c = content.trim();
    if (!c) {
      setActionError("Tilbudsindhold mangler.");
      return null;
    }
    setSaving(true);
    setActionError(null);

    if (quoteId) {
      const { error } = await supabase
        .from("quotes")
        .update({ title: t, content: c, recipient_email: email, status: "draft" })
        .eq("id", quoteId);
      setSaving(false);
      if (error) {
        logSupabaseError("[portal/tilbud/new] update", error);
        setActionError(error.message);
        return null;
      }
      setTitle(t);
      return quoteId;
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: userId,
        recipient_email: email,
        title: t,
        content: c,
        status: "draft",
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      logSupabaseError("[portal/tilbud/new] insert", error);
      setActionError(error.message);
      return null;
    }
    const id = (data as { id: string }).id;
    setQuoteId(id);
    setTitle(t);
    return id;
  };

  const handleSaveDraft = async (e: FormEvent) => {
    e.preventDefault();
    const id = await saveDraft();
    if (id) router.push(`/portal/tilbud/${id}`);
  };

  const handleSend = async () => {
    setActionError(null);
    const id = quoteId ?? (await saveDraft());
    if (!id) return;
    setSending(true);
    const res = await fetch(`/api/portal/quotes/${id}/send`, {
      method: "POST",
      credentials: "same-origin",
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
    setSending(false);
    if (!res.ok) {
      setActionError(payload.error ?? "Afsendelse fejlede.");
      return;
    }
    router.push(`/portal/tilbud/${id}`);
  };

  return (
    <PortalLayout activeNav="tilbud">
      <div>
        <Link href="/portal/tilbud" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til tilbud
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900 md:text-3xl">Nyt tilbud</h1>
        <p className="mt-2 text-sm text-slate-600">
          Beskriv din kundes behov, vælg tjenester og lad AI generere et professionelt dansk tilbud.
        </p>

        {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}

        <form onSubmit={handleSaveDraft} className="mt-8 space-y-10">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Modtager</h2>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="kunde@firma.dk"
              className="mt-3 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Vælg tjenester</h2>
            {services.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Ingen tjenester endnu.{" "}
                <Link href="/portal/tjenester" className="font-semibold text-emerald-700 hover:underline">
                  Opret tjenester først
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {services.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleService(s.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">{s.name}</span>
                        {s.description ? (
                          <span className="mt-0.5 block text-sm text-slate-600">{s.description}</span>
                        ) : null}
                        <span className="mt-1 block text-sm text-slate-800">
                          {formatDkk(s.price)} · {serviceUnitLabel(s.unit)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Beskriv din kundes behov</h2>
            <textarea
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              rows={5}
              placeholder="Skriv kort hvad kunden har brug for, ønsket tidsplan og eventuelle krav..."
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {generating ? "Genererer..." : "Generer tilbud"}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Titel og tilbudstekst</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fx Tilbud — [kunde] — dato"
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              placeholder="Det genererede tilbud vises her — redigér frit."
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm leading-relaxed"
            />
          </section>

          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || sending}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {saving ? "Gemmer..." : "Gem som kladde"}
            </button>
            <button
              type="button"
              disabled={saving || sending}
              onClick={() => void handleSend()}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
            >
              {sending ? "Sender..." : "Send tilbud"}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
