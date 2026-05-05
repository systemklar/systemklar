"use client";

import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!res.ok) {
      setError(payload?.error ?? "Kunne ikke sende beskeden.");
      setSubmitting(false);
      return;
    }

    setSuccess(payload?.message ?? "Tak! Vi har modtaget din henvendelse.");
    setForm(empty);
    setSubmitting(false);
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
      <h2 className="text-xl font-bold text-[#0A0A0A]">Send en besked</h2>
      <p className="mt-2 text-sm text-[#6B6B6B]">Vi svarer som udgangspunkt inden for én arbejdsdag.</p>

      {success ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <p className="font-semibold">Sendt</p>
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
          <div className="md:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Navn</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Telefon</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Emne</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              placeholder="Valgfrit"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0A0A0A]">Besked</label>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#0A0A0A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary cta-pulse w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Sender..." : "Send besked"}
        </button>
      </form>
    </section>
  );
}
