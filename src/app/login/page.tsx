"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
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
    <AuthSplitLayout
      title="Log ind"
      subtitle="Velkommen tilbage"
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
              className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-sky-500 md:text-sm"
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
              className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-sky-500 md:text-sm"
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

          <Link href="/forgot-password" className="block text-sm font-semibold text-sky-600 hover:underline">
            Glemt adgangskode?
          </Link>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {isLoading ? "Logger ind..." : "Log ind"}
          </button>
          <p className="mt-4 text-center text-xs text-[#4A8CB5]">
            Ved at logge ind accepterer du vores{" "}
            <a href="/vilkaar" className="text-sky-600 hover:underline">
              vilkår
            </a>{" "}
            og{" "}
            <a href="/privatlivspolitik" className="text-sky-600 hover:underline">
              privatlivspolitik
            </a>
          </p>
      </form>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-sky-600 hover:underline">
        Tilbage til forsiden
      </Link>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-20 text-[#78716C]">
          <div className="mx-auto max-w-md text-center">Indlæser...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
