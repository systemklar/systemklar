"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type InvitationRow = {
  email: string;
  role: string;
  contact_name: string | null;
  organisation_id: string;
  organisations: { name: string } | { name: string }[] | null;
};

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get("token") ?? "";
  const orgName = invitation
    ? Array.isArray(invitation.organisations)
      ? invitation.organisations[0]?.name ?? "systemklar"
      : invitation.organisations?.name ?? "systemklar"
    : "systemklar";

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setError("Dette invitationslink er ugyldigt eller udløbet.");
        setLoading(false);
        return;
      }
      const { data, error: inviteError } = await supabase
        .from("invitations")
        .select("email, role, contact_name, organisation_id, organisations(name)")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cancelled) return;
      if (inviteError || !data) {
        setInvitation(null);
        setError("Dette invitationslink er ugyldigt eller udløbet.");
      } else {
        setInvitation(data as InvitationRow);
        const inviteContactName = ((data as InvitationRow).contact_name ?? "").trim();
        if (inviteContactName) setFullName(inviteContactName);
        setError(null);
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;
    if (fullName.trim().length < 2) {
      setError("Indtast dit fulde navn.");
      return;
    }
    if (password.length < 8) {
      setError("Adgangskoden skal være mindst 8 tegn.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Adgangskoderne matcher ikke.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
    });

    let authUserId = signUpData.user?.id ?? null;
    if (signUpError) {
      const isExistingUser = signUpError.message.toLowerCase().includes("already registered");
      if (!isExistingUser) {
        setError("Kunne ikke oprette brugeren. Prøv igen eller kontakt support.");
        setSubmitting(false);
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError || !signInData.user) {
        setError(
          "Emailen findes allerede, men adgangskoden matcher ikke. Log ind med den korrekte adgangskode eller nulstil adgangskoden.",
        );
        setSubmitting(false);
        return;
      }

      authUserId = signInData.user.id;
    }

    if (!authUserId || (!signUpError && !signUpData.session)) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });
      if (signInError || !signInData.user) {
        setError(signInError?.message ?? "Kunne ikke logge ind efter oprettelse.");
        setSubmitting(false);
        return;
      }
      authUserId = signInData.user.id;
    }

    if (!authUserId) {
      setError("Kunne ikke fastslå brugerens id efter oprettelse.");
      setSubmitting(false);
      return;
    }

    const initials = fullName
      .trim()
      .split(/\s+/)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const resolvedOrgName = Array.isArray(invitation.organisations)
      ? invitation.organisations[0]?.name ?? ""
      : invitation.organisations?.name ?? "";

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUserId,
      organisation_id: invitation.organisation_id,
      role: invitation.role,
      full_name: fullName.trim(),
      avatar_initials: initials,
      company_name: resolvedOrgName,
      email: invitation.email,
    });

    if (profileError && profileError.code !== "23505") {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    const { error: acceptError } = await supabase
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("token", token);

    if (acceptError) {
      setError(acceptError.message);
      setSubmitting(false);
      return;
    }

    try {
      await fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation.email,
          name: fullName.trim(),
          orgName: resolvedOrgName || "systemklar",
        }),
      });
    } catch {
      /* non-blocking */
    }

    router.replace("/portal");
  };

  return (
    <AuthSplitLayout>
      <AuthPageHeading
        title="Opret din profil"
        badge={invitation ? `Du er inviteret til ${orgName}` : undefined}
        subtitle={loading ? "Vi tjekker din invitation..." : undefined}
      />

      {loading ? <p className="text-sm text-[#6A82A8]">Indlæser invitation...</p> : null}

      {!loading && error && !invitation ? <AuthFormError>{error}</AuthFormError> : null}

      {!loading && invitation ? (
        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          <AuthField id="full_name" label="Fuldt navn">
            <AuthInput
              id="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </AuthField>
          <AuthField id="password" label="Adgangskode">
            <AuthInput
              id="password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </AuthField>
          <AuthField id="confirm_password" label="Bekræft adgangskode">
            <AuthInput
              id="confirm_password"
              type="password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </AuthField>

          {error ? <AuthFormError>{error}</AuthFormError> : null}

          <AuthSubmitButton loading={submitting} loadingLabel="Opretter...">
            Opret profil
          </AuthSubmitButton>
        </form>
      ) : null}
    </AuthSplitLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-[#6A82A8]">
          Indlæser invitation...
        </main>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
