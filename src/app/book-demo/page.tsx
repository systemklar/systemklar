"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type DemoForm = {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  employees: "" | "1-5" | "6-15" | "16-50" | "50+";
  message: string;
};

const initialForm: DemoForm = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  employees: "",
  message: "",
};

export default function BookDemoPage() {
  const [form, setForm] = useState<DemoForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/book-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!res.ok) {
      setError(payload?.error ?? "Kunne ikke sende anmodning.");
      setSubmitting(false);
      return;
    }

    setSuccess(payload?.message ?? "Tak! Vi kontakter dig inden for 24 timer.");
    setForm(initialForm);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Tilbage til forsiden
        </Link>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Book en demo
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Få en gratis gennemgang af Systemklar</h1>
          <p className="mt-3 text-slate-600">
            Fortæl os lidt om jeres virksomhed, så kontakter vi jer og planlægger en relevant demo.
          </p>

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <p className="font-semibold">Tak for din anmodning</p>
              <p className="mt-1 text-sm">{success}</p>
            </div>
          ) : null}
          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="font-semibold">Noget gik galt</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Navn</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Virksomhedsnavn</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefonnummer</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Antal ansatte</label>
              <select
                value={form.employees}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    employees: (e.target.value as DemoForm["employees"]) ?? "",
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-600"
              >
                <option value="">Vælg antal ansatte</option>
                <option value="1-5">1-5</option>
                <option value="6-15">6-15</option>
                <option value="16-50">16-50</option>
                <option value="50+">50+</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Besked / hvad ønsker du at se?</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "Sender..." : "Book gratis demo"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
