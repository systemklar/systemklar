"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";

type VaultCategory = "microsoft" | "google" | "regnskab" | "webshop" | "hr" | "it" | "andet";

type VaultEntry = {
  id: string;
  name: string;
  username: string | null;
  password: string | null;
  url: string | null;
  category: VaultCategory | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORIES: VaultCategory[] = [
  "microsoft",
  "google",
  "regnskab",
  "webshop",
  "hr",
  "it",
  "andet",
];

const categoryLabel: Record<VaultCategory, string> = {
  microsoft: "Microsoft",
  google: "Google",
  regnskab: "Regnskab",
  webshop: "Webshop",
  hr: "HR",
  it: "IT",
  andet: "Andet",
};

type FormState = {
  name: string;
  username: string;
  password: string;
  url: string;
  category: VaultCategory | "";
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  username: "",
  password: "",
  url: "",
  category: "",
  notes: "",
};

function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      {off ? <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.7" /> : null}
    </svg>
  );
}

export default function PortalKodebankPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VaultCategory | "">("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copyState, setCopyState] = useState<Record<string, "idle" | "copied" | "error">>({});

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/portal/vault", { method: "GET" });
    const payload = (await res.json().catch(() => null)) as { error?: string; entries?: VaultEntry[] } | null;
    if (!res.ok) {
      setError(payload?.error ?? "Kunne ikke hente kodebank.");
      setEntries([]);
      setLoading(false);
      return;
    }
    setEntries(payload?.entries ?? []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadEntries();
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category && entry.category !== category) return false;
      if (!q) return true;
      const haystack = [
        entry.name,
        entry.username ?? "",
        entry.url ?? "",
        entry.notes ?? "",
        entry.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, category]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (entry: VaultEntry) => {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      username: entry.username ?? "",
      password: entry.password ?? "",
      url: entry.url ?? "",
      category: entry.category ?? "",
      notes: entry.notes ?? "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Vil du slette dette login?");
    if (!ok) return;
    const res = await fetch(`/api/portal/vault/${id}`, { method: "DELETE" });
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(payload?.error ?? "Sletning fejlede.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/portal/vault/${editingId}` : "/api/portal/vault";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        password: form.password,
        url: form.url,
        category: form.category || null,
        notes: form.notes,
      }),
    });

    const payload = (await res.json().catch(() => null)) as
      | { error?: string; entry?: VaultEntry }
      | null;

    if (!res.ok || !payload?.entry) {
      setError(payload?.error ?? "Kunne ikke gemme login.");
      setSubmitting(false);
      return;
    }

    setEntries((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === editingId ? payload.entry! : item));
      }
      return [payload.entry!, ...prev];
    });

    setSubmitting(false);
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = async (entry: VaultEntry) => {
    if (!entry.password) return;
    try {
      await navigator.clipboard.writeText(entry.password);
      setCopyState((prev) => ({ ...prev, [entry.id]: "copied" }));
      window.setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [entry.id]: "idle" }));
      }, 1200);
    } catch {
      setCopyState((prev) => ({ ...prev, [entry.id]: "error" }));
      window.setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [entry.id]: "idle" }));
      }, 1200);
    }
  };

  return (
    <PortalLayout activeNav="vault">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Kodebank</h1>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "#1D9E75" }}
          >
            Tilføj login
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg i navn, brugernavn, URL..."
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory((e.target.value as VaultCategory | "") ?? "")}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-500"
          >
            <option value="">Alle kategorier</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Henter logins...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
            Ingen logins fundet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((entry) => {
              const isVisible = !!visiblePasswords[entry.id];
              const copyStatus = copyState[entry.id] ?? "idle";
              return (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{entry.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {entry.category ? categoryLabel[entry.category] : "Ingen kategori"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                    <p>
                      <span className="font-medium">Brugernavn:</span> {entry.username || "-"}
                    </p>
                    <p className="break-all">
                      <span className="font-medium">URL:</span>{" "}
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline"
                        >
                          {entry.url}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-slate-500">Adgangskode</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {isVisible ? entry.password || "-" : entry.password ? "••••••••" : "-"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePassword(entry.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <EyeIcon off={isVisible} />
                          {isVisible ? "Skjul" : "Vis"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyPassword(entry)}
                          disabled={!entry.password}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copyStatus === "copied"
                            ? "Kopieret"
                            : copyStatus === "error"
                              ? "Fejl"
                              : "Kopier"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {entry.notes}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Rediger
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(entry.id)}
                      className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Slet
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? "Rediger login" : "Tilføj login"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Navn</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Brugernavn</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: (e.target.value as VaultCategory | "") ?? "" }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  >
                    <option value="">Ingen kategori</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabel[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Adgangskode</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">URL</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notater</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {submitting ? "Gemmer..." : editingId ? "Gem ændringer" : "Opret login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
