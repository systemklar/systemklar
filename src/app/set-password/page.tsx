"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          setSessionError(
            "Ugyldigt eller udløbet link. Åbn invitationen fra din e-mail igen, eller kontakt support."
          );
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

    router.replace("/portal");
    router.refresh();
  };

  return (
    <AuthSplitLayout title="Vælg adgangskode" subtitle="Du er inviteret som kunde. Vælg en adgangskode til din konto.">

      {!sessionReady && !sessionError && (
        <p className="mt-8 text-sm text-[#78716C]">Indlæser invitation...</p>
      )}

      {sessionError && (
        <div className="mt-8 space-y-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{sessionError}</p>
          <Link href="/login" className="inline-block text-sm font-semibold text-blue-600 hover:underline">
            Gå til log ind
          </Link>
        </div>
      )}

      {sessionReady && (
        <form className="mt-8 space-y-4" onSubmit={(ev) => void handleSubmit(ev)}>
            <div>
              <label htmlFor="pw1" className="mb-1 block text-sm font-medium">
                Vælg adgangskode
              </label>
              <div className="relative">
                <input
                  id="pw1"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  placeholder="Mindst 8 tegn"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pw2" className="mb-1 block text-sm font-medium">
                Bekræft adgangskode
              </label>
              <div className="relative">
                <input
                  id="pw2"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  placeholder="Gentag adgangskode"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full px-5 py-2.5 disabled:opacity-60">
              {submitting ? "Gemmer..." : "Fortsæt til portalen"}
            </button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
