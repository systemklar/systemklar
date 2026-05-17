"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
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
        : `${window.location.origin}/set-password`;

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
    <AuthSplitLayout
      title="Glemt adgangskode"
      subtitle="Indtast din e-mail og vi sender dig et link til at nulstille din adgangskode."
    >

      {sent ? (
        <p className="mt-8 rounded-lg border border-[#C4D8B8] bg-[#EEF4EA] px-3 py-2 text-sm text-[#4A7A3A]">
          Vi har sendt et nulstillingslink til din e-mail.
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
                className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-[#8B9E6B] focus:ring-2 focus:ring-[#EEF2E6]"
                placeholder="dig@firma.dk"
                autoComplete="email"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            ) : null}

            <button type="submit" disabled={isLoading} className="btn-primary w-full px-5 py-2.5 disabled:opacity-60">
              {isLoading ? "Sender..." : "Send reset-link"}
            </button>
        </form>
      )}

      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-[#8B9E6B] hover:underline">
        Tilbage til login
      </Link>
    </AuthSplitLayout>
  );
}
