"use client";

import { FormEvent, useState } from "react";
import { MarketingCtaNote } from "@/components/marketing/MarketingCtaNote";

const HELP_TOPICS = [
  "IT-support",
  "Systemovervågning",
  "Månedlig rapport",
  "Ved ikke",
] as const;

type HelpTopic = (typeof HELP_TOPICS)[number];

const inputClass =
  "w-full rounded-xl border border-[#CBD5E8] bg-white px-4 py-3 text-base text-[#0A1628] outline-none transition placeholder:text-[#6A82A8] focus:border-[#2952A3] focus:ring-2 focus:ring-[#E8EEFC] md:text-sm";

export function BookDemoCompactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [helpTopic, setHelpTopic] = useState<HelpTopic>("Ved ikke");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          companyName: company.trim(),
          email: email.trim(),
          helpTopic,
          message: `Hvad kan vi hjælpe med: ${helpTopic}`,
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!res.ok || !payload?.ok) {
        setError(payload?.error ?? "Anmodningen kunne ikke sendes. Prøv igen.");
      } else {
        setSuccess(payload.message ?? "Tak — vi kontakter dig inden for 1 hverdag.");
        setName("");
        setEmail("");
        setCompany("");
        setHelpTopic("Ved ikke");
      }
    } catch {
      setError("Anmodningen kunne ikke sendes. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="book-demo"
      className="scroll-mt-24 rounded-2xl border border-[#CBD5E8] bg-white p-6 shadow-[0_8px_32px_rgba(10,22,40,0.06)] md:p-8"
    >
      <p className="text-sm font-medium uppercase tracking-wider text-[#2952A3]">Book en demo</p>
      <h2 className="mt-2 text-2xl font-light tracking-tight text-[#0A1628] md:text-3xl">
        Få en gratis gennemgang af systemklar
      </h2>
      <p className="mt-2 text-sm text-[#2A4868]">
        Udfyld formularen — vi ringer eller skriver inden for 1 hverdag.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demo-name" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
            Navn
          </label>
          <input
            id="demo-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="demo-email" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
            Email
          </label>
          <input
            id="demo-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="demo-company" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
            Virksomhed
          </label>
          <input
            id="demo-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="demo-topic" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
            Hvad kan vi hjælpe med?
          </label>
          <select
            id="demo-topic"
            value={helpTopic}
            onChange={(e) => setHelpTopic(e.target.value as HelpTopic)}
            className={inputClass}
          >
            {HELP_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          {error ? (
            <p className="mb-3 rounded-lg border border-[#F0C0B8] bg-[#FEF0EE] px-3 py-2 text-sm text-[#8A2A1A]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mb-3 rounded-lg border border-[#B0E8D0] bg-[#E8FAF4] px-3 py-2 text-sm text-[#0A6A4A]">
              {success}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] w-full rounded-full bg-[#2952A3] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E4490] disabled:opacity-60"
          >
            {submitting ? "Sender..." : "Book en demo"}
          </button>
          <MarketingCtaNote className="mt-3" />
        </div>
      </form>
    </div>
  );
}
