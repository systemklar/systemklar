"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { SystemklarLogo } from "@/components/SystemklarLogo";

type DemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
};

const fieldClass =
  "w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-sky-500";

export function DemoModal({ isOpen, onClose, subject }: DemoModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectValue, setSubjectValue] = useState(subject ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubjectValue(subject ?? "");
    setSuccess(false);
    setError(null);
  }, [isOpen, subject]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          phone,
          subject: subject ?? subjectValue,
          message: message.trim() || `Demoforespørgsel: ${(subject ?? subjectValue) || "Demo"}`,
        }),
      });

      if (!res.ok) throw new Error("Kontaktforespørgslen kunne ikke sendes.");
      setSuccess(true);
      setName("");
      setEmail("");
      setCompany("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Noget gik galt. Prøv igen eller skriv direkte til kontakt@systemklar.dk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-12"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <style>{`
        @keyframes demoModalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        style={{ animation: "demoModalIn 160ms ease-out both" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Luk modal"
        >
          <X className="h-4 w-4" />
        </button>

        <SystemklarLogo href="/" variant="light" size="md" />
        <h2 id="demo-modal-title" className="mt-6 text-xl font-bold text-[#0D1F2D]">
          Book en gratis snak
        </h2>
        <p className="mt-1 text-sm text-[#4A8CB5]">30 min · gratis · uforpligtende</p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-green-800">Tak! Vi vender tilbage inden for én hverdag.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Navn"
              required
              className={fieldClass}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={fieldClass}
            />
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Virksomhed"
              required
              className={fieldClass}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon (valgfrit)"
              className={fieldClass}
            />
            {subject ? null : (
              <input
                value={subjectValue}
                onChange={(e) => setSubjectValue(e.target.value)}
                placeholder="Emne"
                className={fieldClass}
              />
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Besked (valgfrit)"
              className={`${fieldClass} h-24 resize-none`}
            />
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0A6EBD] py-3 font-semibold text-white transition-colors hover:bg-[#0859A0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sender..." : "Send forespørgsel"}
            </button>
            <p className="mt-3 text-center text-xs text-[#4A8CB5]">Ingen binding · Opsig når som helst</p>
          </form>
        )}
      </div>
    </div>
  );
}
