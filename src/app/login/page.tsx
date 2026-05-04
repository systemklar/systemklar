"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

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

    router.push("/portal");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-white px-6 py-20 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 p-8 shadow-sm">
        <p
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#E7F6F1", color: "#1D9E75" }}
        >
          Systemklar kundeportal
        </p>
        <h1 className="text-3xl font-bold">Log ind</h1>
        <p className="mt-2 text-sm text-slate-600">
          Log ind for at få adgang til kundeportalen.
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
