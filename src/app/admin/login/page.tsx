"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase";

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

function AdminLoginForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRememberMe(window.localStorage.getItem("adminRememberMe") === "true");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("[admin/login] signInWithPassword failed", {
        email: normalizedEmail,
        error,
      });
      setErrorMessage(toDanishAuthError(error.message));
      setIsLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase.auth.signOut();
      setErrorMessage("Kunne ikke hente bruger. Prøv igen.");
      setIsLoading(false);
      return;
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("[admin/login] admins lookup failed", adminError);
      await supabase.auth.signOut();
      setErrorMessage("Kunne ikke verificere admin-adgang. Prøv igen.");
      setIsLoading(false);
      return;
    }

    if (!adminRow) {
      await supabase.auth.signOut();
      setErrorMessage("Du har ikke adgang til admin-portalen.");
      setIsLoading(false);
      return;
    }

    window.localStorage.setItem("adminRememberMe", rememberMe ? "true" : "false");
    window.location.href = "/admin/dashboard";
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
              className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-sky-500 md:text-sm"
              placeholder="din@email.dk"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Adgangskode
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-sky-200 px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-sky-500 md:text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
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

          <label className="flex items-center gap-2 text-sm text-[#78716C]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Husk mig
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {isLoading ? "Logger ind..." : "Log ind"}
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
