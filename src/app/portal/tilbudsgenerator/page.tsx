"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { formatDanishDateTime } from "@/components/tickets/StatusBadge";
import { formatDkk, serviceUnitLabel } from "@/lib/service-units";
import { logSupabaseError } from "@/lib/supabase-error";
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
  const [needs, setNeeds] = useState("");
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
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, price, unit, created_at")
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
    const { data, error } = await supabase
      .from("quotes")
      .select("id, title, recipient_email, status, created_at, sent_at")
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

    setSavingService(true);
    setFormError(null);

    if (modalMode === "create") {
      const { error } = await supabase.from("services").insert({
        user_id: userId,
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
      const { error } = await supabase
        .from("services")
        .update({
          name: n,
          description: description.trim() || null,
          price: priceNum,
          unit,
        })
        .eq("id", editing.id);
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
    const { error } = await supabase.from("services").delete().eq("id", r.id);
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

  const handleGenerate = async () => {
    if (selected.size === 0) {
      setActionError("Vælg mindst én ydelse.");
      return;
    }
    setGenerating(true);
    setActionError(null);
    setActionOk(null);
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
    setSavingQuote(true);
    setActionError(null);
    setActionOk(null);

    if (quoteId) {
      const { error } = await supabase
        .from("quotes")
        .update({ title: t, content: c, recipient_email: email, status: "draft" })
        .eq("id", quoteId);
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
        user_id: userId,
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

  return (
    <PortalLayout activeNav="tilbudsgenerator">
      <div className="space-y-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917] md:text-3xl">AI Tilbudsgenerator</h1>
          <p className="mt-2 text-sm text-[#78716C]">
            Administrer dine ydelser og generér professionelle tilbud med AI — på én side.
          </p>
        </header>

        <section
          id="ydelser"
          className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1C1917]">Mine ydelser &amp; priser</h2>
              <p className="mt-1 text-sm text-[#78716C]">Disse ydelser kan du vælge når du genererer et tilbud nedenfor.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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

        <section
          id="generator"
          className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm md:p-8"
        >
          <h2 className="text-lg font-semibold text-[#1C1917]">Generer tilbud med AI</h2>
          <p className="mt-1 text-sm text-[#78716C]">Vælg ydelser, beskriv behovet og generér — redigér teksten før du gemmer eller sender.</p>

          <form onSubmit={handleSaveDraft} className="mt-8 space-y-8">
            <div>
              <label className="block text-sm font-medium text-[#1C1917]">Modtagerens email</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="kunde@firma.dk"
                className="mt-2 w-full max-w-md rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">Vælg ydelser</h3>
              {services.length === 0 ? (
                <p className="mt-3 text-sm text-[#78716C]">
                  Tilføj ydelser i sektionen ovenfor først.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {services.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer gap-3 rounded-lg border border-stone-100 p-3 hover:bg-stone-50">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleService(s.id)}
                          className="mt-1"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-[#1C1917]">{s.name}</span>
                          {s.description ? (
                            <span className="mt-0.5 block text-sm text-[#78716C]">{s.description}</span>
                          ) : null}
                          <span className="mt-1 block text-sm text-[#1C1917]">
                            {formatDkk(s.price)} · {serviceUnitLabel(s.unit)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1917]">Beskriv kundens behov</label>
              <textarea
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                rows={5}
                placeholder="Skriv kort hvad kunden har brug for, ønsket tidsplan og eventuelle krav..."
                className="mt-2 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleGenerate()}
                className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? "Genererer..." : "Generer tilbud med AI"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1917]">Titel</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Fx Tilbud — [kunde] — dato"
                className="mt-2 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label className="mt-4 block text-sm font-medium text-[#1C1917]">Tilbudstekst</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                placeholder="Det genererede tilbud vises her — redigér frit."
                className="mt-2 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            {actionOk ? <p className="text-sm text-green-700">{actionOk}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingQuote || sending}
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {savingQuote ? "Gemmer..." : "Gem som kladde"}
              </button>
              <button
                type="button"
                disabled={savingQuote || sending}
                onClick={() => void handleSend()}
                className="rounded-full border border-[#E7E5E4] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C1917] shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
              >
                {sending ? "Sender..." : "Send tilbud"}
              </button>
            </div>
          </form>

          <div className="mt-10 border-t border-[#E7E5E4] pt-8">
            <h3 className="text-sm font-semibold text-[#1C1917]">Mine tilbud</h3>
            <p className="mt-1 text-sm text-[#78716C]">Åbn et tidligere tilbud for at redigere eller sende igen.</p>
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
          </div>
        </section>

        {modalMode ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal
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
                    className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917]">Beskrivelse</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
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
                      className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                      placeholder="fx 499"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1C1917]">Enhed</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
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
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingService ? "Gemmer..." : "Gem"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </PortalLayout>
  );
}
