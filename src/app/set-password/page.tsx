"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/auth/auth-ui";
import { createClient } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

export default function SetPasswordPage() {
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
        if (sess?.user) setSessionReady(true);
      });
      unsubscribe = () => subscription.unsubscribe();

      timeoutId = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          const {
            data: { session: late },
          } = await supabase.auth.getSession();
          if (cancelled || late?.user) return;
          setSessionError(
            "Ugyldigt eller udløbet link. Åbn linket fra din e-mail igen, eller kontakt support.",
          );
        })();
      }, 3000);
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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
    <AuthSplitLayout>
      <AuthPageHeading title="Vælg ny adgangskode" />

      {!sessionReady && !sessionError ? (
        <p className="text-sm text-[#7A9AB0]">Indlæser...</p>
      ) : null}

      {sessionError ? (
        <>
          <AuthFormError>{sessionError}</AuthFormError>
          <AuthBackLink href="/login">← Tilbage til login</AuthBackLink>
        </>
      ) : null}

      {sessionReady ? (
        <form className="space-y-5" onSubmit={(ev) => void handleSubmit(ev)}>
          <AuthField id="pw1" label="Ny adgangskode">
            <AuthInput
              id="pw1"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindst 8 tegn"
            />
          </AuthField>
          <AuthField id="pw2" label="Bekræft adgangskode">
            <AuthInput
              id="pw2"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Gentag adgangskode"
            />
          </AuthField>

          {submitError ? <AuthFormError>{submitError}</AuthFormError> : null}

          <AuthSubmitButton loading={submitting} loadingLabel="Gemmer...">
            Gem adgangskode
          </AuthSubmitButton>
        </form>
      ) : null}
    </AuthSplitLayout>
  );
}
