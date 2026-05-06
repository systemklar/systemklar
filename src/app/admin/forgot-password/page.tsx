"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase";

export default function AdminForgotPasswordPage() {
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
        : `${window.location.origin}/admin/set-password`;

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
      subtitle="Indtast din admin e-mail og vi sender dig et link til at nulstille din adgangskode."
    >

      {sent ? (
        <p className="mt-8 rounded-lg border border-blue-100 bg-[#EFF6FF] px-3 py-2 text-sm text-blue-800">
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
                className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                placeholder="kontakt@systemklar.dk"
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

      <Link href="/admin/login" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
        Tilbage til admin login
      </Link>
    </AuthSplitLayout>
  );
}
