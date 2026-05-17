"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import { BookDemoCompactForm } from "@/components/marketing/kontakt/BookDemoCompactForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { MarketingCtaSection } from "@/components/marketing/MarketingCtaSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import {
  MARKETING_CONTACT_EMAIL,
  MARKETING_CONTACT_PHONE_DISPLAY,
  MARKETING_CONTACT_PHONE_TEL,
} from "@/lib/marketing-contact";

const inputClass =
  "w-full rounded-xl border border-[#CBD5E8] bg-white px-4 py-3 text-base text-[#0A1628] outline-none transition placeholder:text-[#6A82A8] focus:border-[#2952A3] focus:ring-2 focus:ring-[#E8EEFC] md:text-sm";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: "",
          message: message.trim(),
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!res.ok || !payload?.ok) {
        setError(payload?.error ?? "Beskeden kunne ikke sendes. Prøv igen.");
      } else {
        setSuccess(payload.message ?? "Tak — vi vender tilbage inden for 1 hverdag.");
        setName("");
        setCompany("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setError("Beskeden kunne ikke sendes. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingShell>
      <section className="bg-[#F2F5FA] px-6 py-16 md:py-20">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-light tracking-tight text-[#0A1628] md:text-5xl">Kontakt os</h1>
          <p className="mt-4 text-lg text-[#2A4868]">
            Book en demo eller skriv til os — vi svarer inden for 1 hverdag.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-white px-6 pb-12 pt-4 md:pb-16">
        <ScrollReveal className="mx-auto max-w-2xl">
          <BookDemoCompactForm />
        </ScrollReveal>
      </section>

      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-5 lg:gap-12">
          <ScrollReveal className="lg:col-span-2">
            <aside className="h-full rounded-2xl border border-[#CBD5E8] bg-[#F2F5FA] p-8">
              <h2 className="text-lg font-medium text-[#0A1628]">Kontaktinformation</h2>
              <ul className="mt-6 space-y-6">
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#2952A3]" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">Email</p>
                    <a
                      href={`mailto:${MARKETING_CONTACT_EMAIL}`}
                      className="text-sm text-[#2952A3] hover:underline"
                    >
                      {MARKETING_CONTACT_EMAIL}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#2952A3]" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">Telefon</p>
                    <a href={`tel:${MARKETING_CONTACT_PHONE_TEL}`} className="text-sm text-[#2952A3] hover:underline">
                      {MARKETING_CONTACT_PHONE_DISPLAY}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#2952A3]" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">Svartid</p>
                    <p className="text-sm text-[#2A4868]">Vi svarer inden for 1 hverdag</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#2952A3]" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">Lokation</p>
                    <p className="text-sm text-[#2A4868]">Danmark — remote først</p>
                  </div>
                </li>
              </ul>
            </aside>
          </ScrollReveal>

          <ScrollReveal staggerMs={100} className="lg:col-span-3">
            <div className="rounded-2xl border border-[#CBD5E8] bg-white p-6 md:p-8">
              <h2 className="text-lg font-medium text-[#0A1628]">Send en besked</h2>
              <p className="mt-1 text-sm text-[#2A4868]">Udfyld formularen, så vender vi tilbage hurtigst muligt.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
                    Navn
                  </label>
                  <input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
                    Virksomhed
                  </label>
                  <input
                    id="contact-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-[#0A1628]">
                    Besked
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className={inputClass}
                  />
                </div>
                {error ? (
                  <p className="rounded-lg border border-[#F0C0B8] bg-[#FEF0EE] px-3 py-2 text-sm text-[#8A2A1A]">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-lg border border-[#B0E8D0] bg-[#E8FAF4] px-3 py-2 text-sm text-[#0A6A4A]">
                    {success}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] w-full rounded-full bg-[#2952A3] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E4490] disabled:opacity-60"
                >
                  {submitting ? "Sender..." : "Send besked"}
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <FaqAccordion />
      <MarketingCtaSection heading="Har du flere spørgsmål?" />
    </MarketingShell>
  );
}
