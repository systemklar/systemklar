"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase";

function AdminLoginForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSent(false);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: "https://systemklar.dk/admin/dashboard" },
    });

    if (error) {
      console.error("[admin/login] signInWithOtp failed", {
        email: normalizedEmail,
        error,
      });
      setErrorMessage("Kunne ikke sende login-link. Prøv igen.");
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  return (
    <AuthSplitLayout
      title="Admin login"
      subtitle="Velkommen tilbage"
      sideTitle="Admin – systemklar"
      sideBullets={["Se kundeoverblik og aktivitet", "Håndter supportssager centralt", "Følg rapporter og systemstatus"]}
    >

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
              className="w-full rounded-xl border border-sky-200 px-4 py-3 outline-none transition focus:ring-2 focus:ring-sky-500"
              placeholder="din@email.dk"
              autoComplete="email"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          {sent ? (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
              Tjek din indbakke – vi har sendt et login-link til {email.trim().toLowerCase()}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {isLoading ? "Sender link..." : "Send login-link"}
          </button>
      </form>

      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-sky-600 hover:underline">
        Gå til kunde-login
      </Link>
    </AuthSplitLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-20 text-[#78716C]">
          <div className="mx-auto max-w-md text-center">Indlæser...</div>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
