"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

export default function AdminSetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let timeoutId: number | undefined;

    const run = async () => {
      const {
        data: { session: first },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (first?.user) {
        setSessionReady(true);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (cancelled) return;
        if (sess?.user) {
          setSessionReady(true);
        }
      });
      unsubscribe = () => subscription.unsubscribe();

      await supabase.auth.getSession();

      timeoutId = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          const {
            data: { session: late },
          } = await supabase.auth.getSession();
          if (cancelled || late?.user) return;
          setSessionError("Ugyldigt eller udløbet link. Bed om et nyt reset-link.");
        })();
      }, 3000);
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [supabase]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`Adgangskoden skal være mindst ${MIN_PASSWORD_LENGTH} tegn.`);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Adgangskoderne er ikke ens.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
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
        <h1 className="text-3xl font-bold">Vælg ny admin-adgangskode</h1>
        <p className="mt-2 text-sm text-slate-600">Sæt en ny adgangskode til din admin-konto.</p>

        {!sessionReady && !sessionError ? (
          <p className="mt-8 text-sm text-slate-500">Indlæser reset-link...</p>
        ) : null}

        {sessionError ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{sessionError}</p>
            <Link href="/admin/login" className="inline-block text-sm font-semibold text-emerald-700">
              Gå til admin login
            </Link>
          </div>
        ) : null}

        {sessionReady ? (
          <form className="mt-8 space-y-4" onSubmit={(ev) => void handleSubmit(ev)}>
            <div>
              <label htmlFor="pw1" className="mb-1 block text-sm font-medium">
                Vælg adgangskode
              </label>
              <input
                id="pw1"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                placeholder="Mindst 8 tegn"
              />
            </div>
            <div>
              <label htmlFor="pw2" className="mb-1 block text-sm font-medium">
                Bekræft adgangskode
              </label>
              <input
                id="pw2"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                placeholder="Gentag adgangskode"
              />
            </div>

            {submitError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#1D9E75" }}
            >
              {submitting ? "Gemmer..." : "Fortsæt til admin"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
