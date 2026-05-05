"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function toDanishAuthError(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Forkert e-mail eller adgangskode. Prøv igen.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Din e-mail er ikke bekræftet. Tjek din indbakke.";
  }
  return message;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await (supabase.auth.signInWithPassword as unknown as (args: {
      email: string;
      password: string;
      options?: { persistSession?: boolean };
    }) => Promise<{ error: { message: string } | null }>)({
      email: normalizedEmail,
      password,
      options: { persistSession: rememberMe },
    });

    if (error) {
      console.error("[login] signInWithPassword failed", {
        email: normalizedEmail,
        error,
      });
      setErrorMessage(toDanishAuthError(error.message));
      setIsLoading(false);
      return;
    }

    const nextRaw = searchParams.get("next");
    const next = safeInternalPath(nextRaw);
    const dest = next && next.startsWith("/portal") ? next : "/portal";
    router.push(dest);

    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-6 py-20 text-[#1C1917]">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#E7E5E4] bg-white p-8 shadow-sm">
        <p className="mb-4 inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-blue-700">
          Systemklar
        </p>
        <h1 className="text-3xl font-bold">Log ind</h1>
        <p className="mt-2 text-sm text-[#78716C]">
          Indtast din e-mail og adgangskode for at logge ind på din kundeportal.
        </p>

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
              className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              placeholder="dig@firma.dk"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Adgangskode
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#78716C]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Husk mig
          </label>

          <Link href="/forgot-password" className="block text-sm font-semibold text-blue-600 hover:underline">
            Glemt adgangskode?
          </Link>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full px-5 py-2.5 disabled:opacity-60">
            {isLoading ? "Logger ind..." : "Log ind"}
          </button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Tilbage til forsiden
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAFAF8] px-6 py-20 text-[#78716C]">
          <div className="mx-auto max-w-md text-center">Indlæser...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
