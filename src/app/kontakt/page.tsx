"use client";

import { CalendarDays, Clock, Mail, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import { DemoModal } from "@/components/ui/DemoModal";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

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
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!res.ok || !payload?.ok) {
        setError(payload?.error ?? "Beskeden kunne ikke sendes. Prøv igen.");
      } else {
        setSuccess(payload.message ?? "Tak! Din besked er sendt – vi vender tilbage hurtigst muligt.");
        setName("");
        setCompany("");
        setEmail("");
        setPhone("");
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
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#8B9E6B] to-[#2C3E2A] py-20 pt-32 md:py-32 md:pt-40">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              Kontakt
            </p>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Vi sidder klar til at hjælpe
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
              Book en demo, stil et spørgsmål, eller hør hvad systemklar kan gøre for jer.
            </p>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-xl font-semibold text-[#2C3020]">Skriv til os</h2>
              <p className="mt-2 text-sm text-[#5C5A48]">
                Udfyld formularen, så vender vi tilbage inden for én hverdag.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Navn"
                  required
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8B9E6B] md:text-sm"
                />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Virksomhed"
                  required
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8B9E6B] md:text-sm"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8B9E6B] md:text-sm"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefon (valgfrit)"
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8B9E6B] md:text-sm"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Besked"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8B9E6B] md:text-sm"
                />
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {success}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] w-full rounded-full bg-[#8B9E6B] px-6 py-3 font-semibold text-white transition hover:bg-[#7A8A5A] disabled:opacity-60"
                >
                  {submitting ? "Sender..." : "Send besked"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <aside className="rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-sm md:p-8">
                <div>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[#8B9E6B]" />
                    <h3 className="font-semibold text-[#2C3020]">Book en gratis demo</h3>
                  </div>
                  <p className="mt-2 text-sm text-[#5C5A48]">
                    Få en kort gennemgang af systemklar – tilpasset jeres virksomhed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    className="mt-4 inline-flex rounded-full bg-[#8B9E6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7A8A5A]"
                  >
                    Book demo
                  </button>
                </div>
                <div className="my-6 h-px bg-[#EEF2E6]" />
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF2E6]">
                    <Phone className="h-4 w-4 text-[#8B9E6B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C3020]">Ring til os</p>
                    <a href="tel:+4522631013" className="text-sm text-[#8B9E6B] hover:underline">
                      +45 22 63 10 13
                    </a>
                    <p className="mt-0.5 text-xs text-[#5C5A48]">Man–fre kl. 9–17</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#5C5A48]">
                  <Mail className="h-4 w-4 text-[#8B9E6B]" />
                  <a href="mailto:kontakt@systemklar.dk" className="text-[#8B9E6B] hover:underline">
                    kontakt@systemklar.dk
                  </a>
                </div>
                <div className="my-6 h-px bg-[#EEF2E6]" />
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-[#8B9E6B]" />
                  <p className="text-sm text-[#5C5A48]">Vi svarer normalt inden for én hverdag.</p>
                </div>
              </aside>

              <div className="rounded-2xl border border-[#D4C9A8] bg-[#EEF2E6] p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#8B9E6B] text-xl font-bold text-white">
                    BS
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C3020]">Benjamin Sørensen</p>
                    <p className="text-sm text-[#5C5A48]">Grundlægger, systemklar</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#5C5A48]">
                  &quot;Jeg sidder personligt klar til at hjælpe. Skriv til mig direkte eller ring – jeg svarer
                  samme dag.&quot;
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href="mailto:benjamin@systemklar.dk"
                    className="flex items-center gap-2 text-sm text-[#8B9E6B] hover:underline"
                  >
                    <Mail className="h-4 w-4" /> benjamin@systemklar.dk
                  </a>
                  <a
                    href="tel:+4522631013"
                    className="flex items-center gap-2 text-sm text-[#8B9E6B] hover:underline"
                  >
                    <Phone className="h-4 w-4" /> +45 22 63 10 13
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#2C3E2A] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-2xl font-bold text-white md:text-4xl">Klar til at komme i gang?</h2>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="mt-8 inline-flex min-h-[44px] rounded-full bg-[#8B9E6B] px-6 py-3 font-semibold text-white transition hover:bg-[#8B9E6B]"
            >
              Book gratis demo
            </button>
          </div>
        </section>
      </main>
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} subject="Demo" />
    </MarketingShell>
  );
}
