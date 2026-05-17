"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  AuthPageHeading,
  AuthSplitLayout,
} from "@/components/auth/AuthSplitLayout";
import {
  AuthField,
  AuthFormError,
  AuthInput,
  AuthSubmitButton,
} from "@/components/auth/auth-ui";
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
    <AuthSplitLayout>
      <AuthPageHeading title="Admin login" subtitle="Log ind på Systemklar admin" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField id="email" label="E-mail">
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="din@email.dk"
            autoComplete="email"
          />
        </AuthField>

        <AuthField id="password" label="Adgangskode">
          <AuthInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </AuthField>

        <label className="flex items-center gap-2 text-sm text-[#2A4868]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-[#CBD5E8] text-[#2952A3] focus:ring-[#2952A3]"
          />
          Husk mig
        </label>

        <div className="flex justify-end">
          <Link href="/admin/forgot-password" className="text-sm text-[#2952A3] hover:text-[#1E4490]">
            Glemt adgangskode?
          </Link>
        </div>

        {errorMessage ? <AuthFormError>{errorMessage}</AuthFormError> : null}

        <AuthSubmitButton loading={isLoading} loadingLabel="Logger ind...">
          Log ind
        </AuthSubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[#6A82A8]">
        <Link href="/login" className="text-[#2952A3] hover:text-[#1E4490]">
          Gå til kunde-login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-[#6A82A8]">
          Indlæser...
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
