"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function AdminForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/admin/set-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setIsLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-20 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 p-8 shadow-sm">
        <p
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#E7F6F1", color: "#1D9E75" }}
        >
          Systemklar Admin
        </p>
        <h1 className="text-3xl font-bold">Glemt adgangskode</h1>
        <p className="mt-2 text-sm text-slate-600">
          Indtast din admin e-mail, så sender vi et link til at sætte en ny adgangskode.
        </p>

        {sent ? (
          <p className="mt-8 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Vi har sendt et link til din email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                placeholder="kontakt@systemklar.dk"
                autoComplete="email"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {isLoading ? "Sender..." : "Send reset-link"}
            </button>
          </form>
        )}

        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:underline"
        >
          Tilbage til admin login
        </Link>
      </div>
    </main>
  );
}
