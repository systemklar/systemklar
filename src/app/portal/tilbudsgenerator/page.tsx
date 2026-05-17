"use client";

import Link from "next/link";
import { Copy, Download, FileSignature } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { MARKETING_CONTACT_EMAIL } from "@/lib/marketing-contact";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { formatDkk, serviceUnitLabel } from "@/lib/service-units";
import { logSupabaseError } from "@/lib/supabase-error";
import { PortalModalOverlay } from "@/components/portal/PortalOverlay";
import { createClient } from "@/lib/supabase";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  unit: string;
  created_at: string;
};

type QuoteListRow = {
  id: string;
  title: string;
  recipient_email: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
};

type ModalMode = "create" | "edit" | null;

function formatDkkLocal(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return String(price);
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(n);
}

function CardCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white" aria-hidden>
      <path
        d="M5 10.5 8.2 13.5 15 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PortalTilbudsgeneratorPage() {
  const supabase = useMemo(() => createClient(), []);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteListRow[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>("månedlig");
  const [savingService, setSavingService] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customerName, setCustomerName] = useState("");
  const [needs, setNeeds] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const profile = session?.user?.id ? await fetchCurrentProfile(supabase, session.user.id) : null;
    if (!profile?.organisation_id) {
      setServices([]);
      setServicesLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, price, unit, created_at")
      .eq("organisation_id", profile.organisation_id)
      .order("name", { ascending: true });
    if (error) {
      logSupabaseError("[portal/tilbudsgenerator] services", error);
      setServices([]);
    } else {
      setServices((data ?? []) as ServiceRow[]);
    }
    setServicesLoading(false);
  }, [supabase]);

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const profile = session?.user?.id ? await fetchCurrentProfile(supabase, session.user.id) : null;
    if (!profile?.organisation_id) {
      setQuotes([]);
      setQuotesLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, recipient_email, status, created_at, sent_at")
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: false });
    if (error) {
      logSupabaseError("[portal/tilbudsgenerator] quotes", error);
      setQuotes([]);
    } else {
      setQuotes((data ?? []) as QuoteListRow[]);
    }
    setQuotesLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadServices();
    void loadQuotes();
  }, [loadServices, loadQuotes]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setUnit("månedlig");
    setFormError(null);
    setModalMode("create");
  };

  const openEdit = (r: ServiceRow) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description ?? "");
    setPrice(String(r.price));
    setUnit(r.unit);
    setFormError(null);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
    setFormError(null);
  };

  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const priceNum = parseFloat(price.replace(",", "."));
    if (!n) {
      setFormError("Navn er påkrævet.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setFormError("Angiv en gyldig pris.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setFormError("Session udløbet. Log ind igen.");
      return;
    }
    const profile = await fetchCurrentProfile(supabase, userId);
    if (!profile?.organisation_id) {
      setFormError("Organisation ikke fundet.");
      return;
    }

    setSavingService(true);
    setFormError(null);

    if (modalMode === "create") {
      const { error } = await supabase.from("services").insert({
        organisation_id: profile.organisation_id,
        name: n,
        description: description.trim() || null,
        price: priceNum,
        unit,
      });
      if (error) {
        logSupabaseError("[portal/tilbudsgenerator] insert", error);
        setFormError(error.message);
        setSavingService(false);
        return;
      }
    } else if (modalMode === "edit" && editing) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const profile = session?.user?.id ? await fetchCurrentProfile(supabase, session.user.id) : null;
      const { error } = await supabase
        .from("services")
        .update({
          name: n,
          description: description.trim() || null,
          price: priceNum,
          unit,
        })
        .eq("id", editing.id)
        .eq("organisation_id", profile?.organisation_id ?? "");
      if (error) {
        logSupabaseError("[portal/tilbudsgenerator] update", error);
        setFormError(error.message);
        setSavingService(false);
        return;
      }
    }

    setSavingService(false);
    closeModal();
    void loadServices();
  };

  const handleDeleteService = async (r: ServiceRow) => {
    const ok = window.confirm(`Slet ydelsen "${r.name}"?`);
    if (!ok) return;
    setDeletingId(r.id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const profile = session?.user?.id ? await fetchCurrentProfile(supabase, session.user.id) : null;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", r.id)
      .eq("organisation_id", profile?.organisation_id ?? "");
    setDeletingId(null);
    if (error) {
      logSupabaseError("[portal/tilbudsgenerator] delete", error);
      alert(error.message);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
    void loadServices();
  };

  const toggleService = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllServices = () => {
    setSelected(new Set(services.map((s) => s.id)));
  };

  const clearServiceSelection = () => {
    setSelected(new Set());
  };

  const handleGenerate = async () => {
    if (selected.size === 0) {
      setActionError("Vælg mindst én ydelse.");
      return;
    }
    setGenerating(true);
    setActionError(null);
    setActionOk(null);
    const needsParts = [
      customerName.trim() ? `Kunde: ${customerName.trim()}` : "",
      needs.trim(),
      validUntil ? `Gyldigt til: ${validUntil}` : "",
    ].filter(Boolean);

    const res = await fetch("/api/portal/quotes/generate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceIds: [...selected],
        needsDescription: needsParts.join("\n\n"),
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
    const profile = await fetchCurrentProfile(supabase, userId);
    if (!profile?.organisation_id) {
      setActionError("Organisation ikke fundet.");
      return null;
    }

    const t = title.trim() || `Tilbud — ${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date())}`;
    const c = content.trim();
    if (!c) {
      setActionError("Tilbudsindhold mangler.");
      return null;
    }
    setSavingQuote(true);
    setActionError(null);
    setActionOk(null);

    if (quoteId) {
      const { error } = await supabase
        .from("quotes")
        .update({ title: t, content: c, recipient_email: email, status: "draft" })
        .eq("id", quoteId)
        .eq("organisation_id", profile.organisation_id);
      setSavingQuote(false);
      if (error) {
        logSupabaseError("[portal/tilbudsgenerator] quote update", error);
        setActionError(error.message);
        return null;
      }
      setTitle(t);
      return quoteId;
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        organisation_id: profile.organisation_id,
        recipient_email: email,
        title: t,
        content: c,
        status: "draft",
      })
      .select("id")
      .single();

    setSavingQuote(false);
    if (error) {
      logSupabaseError("[portal/tilbudsgenerator] quote insert", error);
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
    if (id) {
      setActionOk("Kladde gemt.");
      void loadQuotes();
    }
  };

  const handleSend = async () => {
    setActionError(null);
    setActionOk(null);
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
    setActionOk("Tilbud sendt.");
    void loadQuotes();
  };

  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const s of services) {
      if (!selected.has(s.id)) continue;
      const n = typeof s.price === "string" ? parseFloat(s.price) : s.price;
      if (Number.isFinite(n)) sum += n;
    }
    return sum;
  }, [services, selected]);

  const copyQuote = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setActionOk("Kopieret til udklipsholder.");
    } catch {
      setActionError("Kunne ikke kopiere.");
    }
  };

  const downloadQuote = () => {
    if (!content.trim()) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title.trim() || "tilbud").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasQuote = content.trim().length > 0;

  return (
      <div className="w-full space-y-8 p-6 md:p-8">
        <header className="border-b border-[#E0EAF0] pb-8">
          <SystemklarLogo size="sm" />
          <h1 className="mt-4 text-2xl font-light tracking-tight text-[#1E3448] md:text-3xl">
            AI Tilbudsgenerator
          </h1>
          <p className="mt-2 text-sm text-[#4A6478]">Generér professionelle IT-tilbud på sekunder</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1E3448]">Tilbudsoplysninger</h2>
            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void handleGenerate();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-[#1E3448]">Kundenavn</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#C8D8E4] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A7FA5]"
                  placeholder="Fx Acme ApS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3448]">Modtager-email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#C8D8E4] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A7FA5]"
                  placeholder="kunde@firma.dk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3448]">Ydelser</label>
                {services.length === 0 ? (
                  <p className="mt-2 text-sm text-[#7A9AB0]">Tilføj ydelser i sektionen nedenfor først.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {services.map((s) => {
                      const on = selected.has(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            on
                              ? "border-[#4A7FA5] bg-[#EAF1F7] text-[#1E3448]"
                              : "border-[#C8D8E4] text-[#4A6478] hover:border-[#4A7FA5]"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#1E3448]">Pris (estimat)</label>
                  <p className="mt-1.5 rounded-xl border border-[#E0EAF0] bg-[#F7F4EF] px-3 py-2.5 text-sm font-medium text-[#1E3448]">
                    {selected.size > 0 ? formatDkkLocal(selectedTotal) : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E3448]">Gyldig til</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#C8D8E4] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A7FA5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3448]">Bemærkninger</label>
                <textarea
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-[#C8D8E4] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A7FA5]"
                  placeholder="Kundens behov, tidsplan, særlige ønsker..."
                />
              </div>
              {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
              {actionOk ? <p className="text-sm text-[#3A7A4A]">{actionOk}</p> : null}
              <button
                type="submit"
                disabled={generating || selected.size === 0}
                className="w-full rounded-full bg-[#4A7FA5] py-3 text-sm font-semibold text-white transition hover:bg-[#3A6F95] disabled:opacity-50"
              >
                {generating ? "Genererer…" : "Generér tilbud"}
              </button>
            </form>
          </div>

          <div className="relative flex min-h-[420px] flex-col rounded-2xl border border-[#C8D8E4] bg-white shadow-sm">
            {!hasQuote ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C8D8E4] bg-[#F7F4EF] text-[#4A7FA5]">
                  <FileSignature className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <p className="mt-6 text-sm font-medium text-[#1E3448]">
                  Udfyld formularen for at generere dit første tilbud
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="border-b border-[#E0EAF0] pb-6">
                    <SystemklarLogo size="sm" />
                    <p className="mt-4 text-xs text-[#7A9AB0]">
                      {MARKETING_CONTACT_EMAIL} · systemklar.dk
                    </p>
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-6 w-full border-0 bg-transparent text-lg font-semibold text-[#1E3448] outline-none"
                    placeholder="Tilbudstitel"
                  />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={18}
                    className="mt-4 w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-[#4A6478] outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[#E0EAF0] p-4">
                  <button
                    type="button"
                    onClick={() => void copyQuote()}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C8D8E4] px-4 py-2 text-sm font-medium text-[#4A6478] transition hover:bg-[#F7F4EF]"
                  >
                    <Copy className="h-4 w-4" />
                    Kopiér
                  </button>
                  <button
                    type="button"
                    onClick={downloadQuote}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C8D8E4] px-4 py-2 text-sm font-medium text-[#4A6478] transition hover:bg-[#F7F4EF]"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    type="button"
                    disabled={savingQuote || sending}
                    onClick={() => {
                      void (async () => {
                        const id = await saveDraft();
                        if (id) {
                          setActionOk("Kladde gemt.");
                          void loadQuotes();
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C8D8E4] px-4 py-2 text-sm font-medium text-[#4A6478] transition hover:bg-[#F7F4EF] disabled:opacity-50"
                  >
                    {savingQuote ? "Gemmer…" : "Gem kladde"}
                  </button>
                  <button
                    type="button"
                    disabled={savingQuote || sending}
                    onClick={() => void handleSend()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#4A7FA5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3A6F95] disabled:opacity-50"
                  >
                    Send til kunde
                  </button>
                </div>
              </>
            )}
            <span className="pointer-events-none absolute bottom-3 right-4 rounded-full border border-[#C8D8E4] bg-[#F7F4EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7A9AB0]">
              Drevet af Claude AI
            </span>
          </div>
        </div>

        <section
          id="ydelser"
          className="rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1C1917]">Mine ydelser &amp; priser</h2>
              <p className="mt-1 text-sm text-[#78716C]">Disse ydelser kan du vælge når du genererer et tilbud nedenfor.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-[#4A7FA5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A6F95]"
            >
              Tilføj ydelse
            </button>
          </div>

          {servicesLoading ? (
            <p className="mt-8 text-sm text-slate-500">Henter ydelser...</p>
          ) : services.length === 0 ? (
            <p className="mt-8 text-sm text-[#78716C]">Ingen ydelser endnu. Tilføj den første med knappen ovenfor.</p>
          ) : (
            <ul className="mt-8 divide-y divide-stone-100 overflow-hidden rounded-xl border border-[#E7E5E4]">
              {services.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#1C1917]">{r.name}</p>
                    {r.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[#78716C]">{r.description}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-[#1C1917]">
                      <span className="font-semibold">{formatDkkLocal(r.price)}</span>
                      <span className="text-[#78716C]"> · {serviceUnitLabel(r.unit)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="rounded-lg border border-[#E7E5E4] px-3 py-1.5 text-sm font-medium text-[#1C1917] hover:bg-stone-50"
                    >
                      Rediger
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === r.id}
                      onClick={() => void handleDeleteService(r)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === r.id ? "Sletter..." : "Slet"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-[#1E3448]">Mine tilbud</h2>
          <p className="mt-1 text-sm text-[#4A6478]">Gemte kladder og sendte tilbud</p>
            {quotesLoading ? (
              <p className="mt-4 text-sm text-slate-500">Henter tilbud...</p>
            ) : quotes.length === 0 ? (
              <p className="mt-4 text-sm text-[#78716C]">Du har ingen tilbud endnu.</p>
            ) : (
              <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-[#E7E5E4]">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/portal/tilbud/${q.id}`}
                      className="block px-4 py-4 transition hover:bg-stone-50"
                    >
                      <p className="font-medium text-[#1C1917]">{q.title}</p>
                      <p className="mt-1 text-sm text-[#78716C]">{q.recipient_email || "Ingen modtager sat"}</p>
                      <p className="mt-1 text-xs text-slate-500">Oprettet {formatDanishDateTime(q.created_at)}</p>
                      <p className="mt-1 text-xs font-semibold text-[#1C1917]">
                        {q.status === "sent" && q.sent_at
                          ? `Sendt ${formatDanishDateTime(q.sent_at)}`
                          : "Kladde"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </section>

        {modalMode ? (
          <PortalModalOverlay open onClose={closeModal} position="bottom-sheet">
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-[#1C1917]">
                {modalMode === "create" ? "Ny ydelse" : "Rediger ydelse"}
              </h2>
              <form onSubmit={(e) => void handleServiceSubmit(e)} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917]">Navn</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917]">Beskrivelse</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#1C1917]">Pris (DKK)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]"
                      placeholder="fx 499"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1C1917]">Enhed</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]"
                    >
                      <option value="månedlig">Månedlig</option>
                      <option value="time">Time</option>
                      <option value="engangspris">Engangspris</option>
                    </select>
                  </div>
                </div>
                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-[#78716C] hover:bg-stone-100"
                  >
                    Annuller
                  </button>
                  <button
                    type="submit"
                    disabled={savingService}
                    className="rounded-full bg-[#4A7FA5] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A6F95] disabled:opacity-50"
                  >
                    {savingService ? "Gemmer..." : "Gem"}
                  </button>
                </div>
              </form>
            </div>
          </PortalModalOverlay>
        ) : null}
      </div>
  );
}
