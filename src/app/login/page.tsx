"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    await supabase.auth.getSession();

    const roleRes = await fetch("/api/auth/is-admin", {
      credentials: "same-origin",
      cache: "no-store",
    });

    let isAdmin = false;
    try {
      const body = (await roleRes.json()) as { isAdmin?: boolean };
      isAdmin = body.isAdmin === true;
    } catch {
      isAdmin = false;
    }

    const nextRaw = searchParams.get("next");
    const next = safeInternalPath(nextRaw);

    if (isAdmin) {
      const dest =
        next && next.startsWith("/admin") ? next : "/admin/dashboard";
      router.push(dest);
    } else {
      const dest =
        next && next.startsWith("/portal") ? next : "/portal";
      router.push(dest);
    }

    router.refresh();
  };

  return (
    <main className="min-h-screen bg-white px-6 py-20 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 p-8 shadow-sm">
        <p
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#E7F6F1", color: "#1D9E75" }}
        >
          Systemklar
        </p>
        <h1 className="text-3xl font-bold">Log ind</h1>
        <p className="mt-2 text-sm text-slate-600">
          Log ind med den e-mail og adgangskode, du har fået tilsendt.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "#1D9E75" }}
          >
            {isLoading ? "Logger ind..." : "Log ind"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold"
          style={{ color: "#1D9E75" }}
        >
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
        <main className="min-h-screen bg-white px-6 py-20 text-slate-600">
          <div className="mx-auto max-w-md text-center">Indlæser...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
