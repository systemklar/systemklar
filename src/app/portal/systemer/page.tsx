"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { logSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase";

type SystemType = "cloud" | "server" | "netværk" | "software";
type SystemStatus = "ok" | "advarsel" | "nede";
type SystemRow = {
  id: string;
  organisation_id: string;
  name: string;
  type: SystemType;
  status: SystemStatus;
  url: string | null;
  notes: string | null;
  last_checked: string | null;
  created_at: string;
};

const statusStyles: Record<SystemStatus, string> = {
  ok: "bg-green-100 text-green-800",
  advarsel: "bg-amber-100 text-amber-900",
  nede: "bg-red-100 text-red-800",
};

const statusLabel: Record<SystemStatus, string> = {
  ok: "OK",
  advarsel: "Advarsel",
  nede: "Nede",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export default function PortalSystemsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<SystemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRow | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<SystemType>("cloud");
  const [status, setStatus] = useState<SystemStatus>("ok");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const profile = userId ? await fetchCurrentProfile(supabase, userId) : null;
    if (!profile?.organisation_id) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("systems")
      .select("id, organisation_id, name, type, status, url, notes, last_checked, created_at")
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: false });
    if (error) {
      logSupabaseError("[portal/systemer] list", error);
      setRows([]);
    } else {
      setRows((data ?? []) as SystemRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setType("cloud");
    setStatus("ok");
    setUrl("");
    setNotes("");
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (row: SystemRow) => {
    setEditing(row);
    setName(row.name);
    setType(row.type);
    setStatus(row.status);
    setUrl(row.url ?? "");
    setNotes(row.notes ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Navn er påkrævet.");
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
      setFormError("Organisation ikke fundet for brugeren.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      organisation_id: profile.organisation_id,
      name: trimmedName,
      type,
      status,
      url: url.trim() || null,
      notes: notes.trim() || null,
      last_checked: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase
        .from("systems")
        .update(payload)
        .eq("id", editing.id)
        .eq("organisation_id", profile.organisation_id);
      if (error) {
        logSupabaseError("[portal/systemer] update", error);
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("systems").insert(payload);
      if (error) {
        logSupabaseError("[portal/systemer] insert", error);
        setFormError(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    resetForm();
    void load();
  };

  const handleDelete = async (row: SystemRow) => {
    const ok = window.confirm(`Slet systemet "${row.name}"?`);
    if (!ok) return;
    setDeletingId(row.id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const profile = session?.user?.id ? await fetchCurrentProfile(supabase, session.user.id) : null;
    if (!profile?.organisation_id) {
      setDeletingId(null);
      return;
    }
    const { error } = await supabase
      .from("systems")
      .delete()
      .eq("id", row.id)
      .eq("organisation_id", profile.organisation_id);
    setDeletingId(null);
    if (error) {
      logSupabaseError("[portal/systemer] delete", error);
      alert(error.message);
      return;
    }
    void load();
  };

  return (
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Systemer</h1>
            <p className="mt-2 text-sm text-slate-600">Overblik over dine IT-systemer.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Tilføj system
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Henter systemer...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-sm text-slate-600">Ingen systemer endnu.</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{row.name}</h2>
                    <p className="text-sm text-slate-600">{row.type}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[row.status]}`}>
                    {statusLabel[row.status]}
                  </span>
                </div>
                {row.url ? (
                  <p className="mt-3 text-sm text-slate-700 break-all">{row.url}</p>
                ) : null}
                {row.notes ? <p className="mt-2 text-sm text-slate-600">{row.notes}</p> : null}
                <p className="mt-3 text-xs text-slate-500">Sidst tjekket: {formatDate(row.last_checked)}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Rediger
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === row.id}
                    onClick={() => void handleDelete(row)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === row.id ? "Sletter..." : "Slet"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">{editing ? "Rediger system" : "Tilføj system"}</h2>
              <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Navn</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as SystemType)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="cloud">Cloud</option>
                      <option value="server">Server</option>
                      <option value="netværk">Netværk</option>
                      <option value="software">Software</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as SystemStatus)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="ok">OK</option>
                      <option value="advarsel">Advarsel</option>
                      <option value="nede">Nede</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">URL</label>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Notater</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Annuller
                  </button>
                  <button type="submit" disabled={saving} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Gemmer..." : "Gem"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
  );
}
