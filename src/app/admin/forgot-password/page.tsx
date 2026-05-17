"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AuthBackLink,
  AuthPageHeading,
  AuthSplitLayout,
} from "@/components/auth/AuthSplitLayout";
import {
  AuthField,
  AuthFormError,
  AuthInput,
  AuthSubmitButton,
  AuthSuccessMessage,
} from "@/components/auth/auth-ui";
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
    <AuthSplitLayout>
      <AuthPageHeading
        title="Nulstil adgangskode"
        subtitle="Indtast din admin-email og vi sender dig et link"
      />

      {sent ? (
        <AuthSuccessMessage>Vi har sendt et nulstillingslink til din e-mail.</AuthSuccessMessage>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField id="email" label="E-mail">
            <AuthInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              hasError={Boolean(errorMessage)}
              placeholder="kontakt@systemklar.dk"
              autoComplete="email"
            />
          </AuthField>

          {errorMessage ? <AuthFormError>{errorMessage}</AuthFormError> : null}

          <AuthSubmitButton loading={isLoading} loadingLabel="Sender...">
            Send nulstilningslink
          </AuthSubmitButton>
        </form>
      )}

      <AuthBackLink href="/admin/login">← Tilbage til login</AuthBackLink>
    </AuthSplitLayout>
  );
}
