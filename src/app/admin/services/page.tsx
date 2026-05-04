"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { serviceUnitLabel } from "@/lib/service-units";
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

function formatDkk(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return String(price);
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(n);
}

type ModalMode = "create" | "edit" | null;

export default function AdminServicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>("månedlig");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, price, unit, created_at")
      .order("name", { ascending: true });
    if (error) {
      logSupabaseError("[admin/services] list", error);
      setRows([]);
    } else {
      setRows((data ?? []) as ServiceRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const handleSubmit = async (e: FormEvent) => {
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

    setSaving(true);
    setFormError(null);

    if (modalMode === "create") {
      const { error } = await supabase.from("services").insert({
        name: n,
        description: description.trim() || null,
        price: priceNum,
        unit,
      });
      if (error) {
        logSupabaseError("[admin/services] insert", error);
        setFormError(error.message);
        setSaving(false);
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
        logSupabaseError("[admin/services] update", error);
        setFormError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeModal();
    void load();
  };

  const handleDelete = async (r: ServiceRow) => {
    const ok = window.confirm(`Slet ydelsen «${r.name}»?`);
    if (!ok) return;
    setDeletingId(r.id);
    const { error } = await supabase.from("services").delete().eq("id", r.id);
    setDeletingId(null);
    if (error) {
      logSupabaseError("[admin/services] delete", error);
      alert(error.message);
      return;
    }
    void load();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Tjenester</h1>
          <p className="mt-2 text-sm text-slate-600">Prisliste brugt i AI-tilbudsgeneratoren.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#1D9E75" }}
        >
          Ny tjeneste
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Henter tjenester...</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">Ingen tjenester endnu. Opret den første.</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{r.name}</p>
                {r.description ? (
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.description}</p>
                ) : null}
                <p className="mt-1 text-sm text-slate-800">
                  <span className="font-semibold">{formatDkk(r.price)}</span>
                  <span className="text-slate-500"> · {serviceUnitLabel(r.unit)}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Rediger
                </button>
                <button
                  type="button"
                  disabled={deletingId === r.id}
                  onClick={() => void handleDelete(r)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === r.id ? "Sletter..." : "Slet"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {modalMode === "create" ? "Ny tjeneste" : "Rediger tjeneste"}
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Navn</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Beskrivelse</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Pris (DKK)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="fx 499"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Enhed</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="månedlig">Månedlig</option>
                    <option value="time">Time</option>
                    <option value="engangspris">Engangs­pris</option>
                  </select>
                </div>
              </div>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  {saving ? "Gemmer..." : "Gem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
