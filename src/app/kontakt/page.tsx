"use client";

import Link from "next/link";
import { CalendarDays, Clock, Mail, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Kontakt fra ${company || name || "hjemmesiden"}`);
    const body = encodeURIComponent(
      `Navn: ${name}\nVirksomhed: ${company}\nEmail: ${email}\nTelefon: ${phone || "-"}\n\nBesked:\n${message}`,
    );
    window.location.href = `mailto:kontakt@systemklar.dk?subject=${subject}&body=${body}`;
  };

  return (
    <MarketingShell>
      <main>
        <section className="bg-[#F0F7FF] py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="inline-flex rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-600">
              Kontakt
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-[#0D1F2D] md:text-5xl">
              Vi sidder klar til at hjælpe
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[#2C4A5E]">
              Book en demo, stil et spørgsmål, eller hør hvad systemklar kan gøre for jer.
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0D1F2D]">Skriv til os</h2>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Navn"
                  required
                  className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Virksomhed"
                  required
                  className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefon (valgfrit)"
                  className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Besked"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
                >
                  Send besked
                </button>
              </form>
            </div>

            <aside className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-sky-600" />
                  <h3 className="font-semibold text-[#0D1F2D]">Book en gratis demo</h3>
                </div>
                <p className="mt-2 text-sm text-[#2C4A5E]">
                  Få en kort gennemgang af systemklar – tilpasset jeres virksomhed.
                </p>
                <a
                  href="mailto:kontakt@systemklar.dk?subject=Demo"
                  className="mt-4 inline-flex rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Book demo
                </a>
              </div>
              <div className="my-6 h-px bg-sky-100" />
              <div className="space-y-3 text-sm text-[#2C4A5E]">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>kontakt@systemklar.dk</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-sky-600" />
                  <span>(udfyldes senere)</span>
                </div>
              </div>
              <div className="my-6 h-px bg-sky-100" />
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-sky-600" />
                <p className="text-sm text-[#2C4A5E]">Vi svarer normalt inden for én hverdag.</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[#062840] py-24">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Klar til at komme i gang?</h2>
            <Link
              href="/kontakt"
              className="mt-8 inline-flex rounded-full bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
            >
              Book gratis demo
            </Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
