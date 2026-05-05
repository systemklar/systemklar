"use client";

import { FormEvent, useState } from "react";

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

export function BookDemoForm() {
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
    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
      <p className="inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-3 py-1 text-xs font-semibold text-[#6B6B6B]">
        Book en demo
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0A0A0A] md:text-4xl">Gratis gennemgang af Systemklar</h1>
      <p className="mt-4 max-w-2xl text-[#6B6B6B]">
        Fortæl os lidt om jeres virksomhed — så kontakter vi jer og planlægger en relevant demo.
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

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Navn</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Virksomhedsnavn</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Telefonnummer</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Antal ansatte</label>
          <select
            value={form.employees}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                employees: (e.target.value as DemoForm["employees"]) ?? "",
              }))
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          >
            <option value="">Vælg antal ansatte</option>
            <option value="1-5">1-5</option>
            <option value="6-15">6-15</option>
            <option value="16-50">16-50</option>
            <option value="50+">50+</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Besked / hvad ønsker I at se?</label>
          <textarea
            rows={5}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Sender..." : "Book gratis demo"}
        </button>
      </form>
    </section>
  );
}
