"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
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
        if (inviteContactName) {
          setFullName(inviteContactName);
        }
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
        console.error("[invite] signUp fejlede", signUpError);
        setError("Kunne ikke oprette brugeren. Prøv igen eller kontakt support.");
        setSubmitting(false);
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError || !signInData.user) {
        console.error("[invite] signInWithPassword fejlede for eksisterende bruger", {
          signUpError,
          signInError,
        });
        setError(
          "Emailen findes allerede, men adgangskoden matcher ikke. Log ind med den korrekte adgangskode eller nulstil adgangskoden."
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
        console.error("[invite] signInWithPassword fejlede efter signUp", signInError);
        setError(signInError?.message ?? "Kunne ikke logge ind efter oprettelse.");
        setSubmitting(false);
        return;
      }
      authUserId = signInData.user.id;
    }

    if (!authUserId) {
      console.error("[invite] manglende auth user id efter signUp/signIn");
      setError("Kunne ikke fastslå brugerens auth-id efter oprettelse.");
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

    const orgName = Array.isArray(invitation.organisations)
      ? invitation.organisations[0]?.name ?? ""
      : invitation.organisations?.name ?? "";

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUserId,
      organisation_id: invitation.organisation_id,
      role: invitation.role,
      full_name: fullName.trim(),
      avatar_initials: initials,
      company_name: orgName,
      email: invitation.email,
    });

    if (profileError) {
      // 23505 = unique_violation — profilen findes allerede (fx fra trigger), så vi fortsætter.
      if (profileError.code === "23505") {
        console.warn("[invite] profile findes allerede, fortsætter", {
          authUserId,
          detail: profileError.message,
        });
      } else {
        console.error("[invite] profile insert fejlede", profileError);
        setError(profileError.message);
        setSubmitting(false);
        return;
      }
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
          orgName: orgName || "systemklar",
        }),
      });
    } catch (welcomeError) {
      console.error("[invite] welcome email", welcomeError);
    }

    router.replace("/portal");
  };

  return (
    <AuthSplitLayout
      title="Opret din profil"
      subtitle={invitation ? `Du er inviteret med ${invitation.email}` : "Vi tjekker din invitation..."}
      sideTitle={`Velkommen til ${orgName}`}
    >
      {loading ? <p className="mt-8 text-sm text-[#4A6478]">Indlæser invitation...</p> : null}
      {!loading && error ? <p className="mt-8 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p> : null}

      {!loading && invitation ? (
        <form className="mt-8 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
              Fuldt navn
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[#E7E5E4] px-3 py-3 text-base outline-none transition focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#EAF1F7] md:py-2 md:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Adgangskode
            </label>
            <input
              id="password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E7E5E4] px-3 py-3 text-base outline-none transition focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#EAF1F7] md:py-2 md:text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="mb-1 block text-sm font-medium">
              Bekræft adgangskode
            </label>
            <input
              id="confirm_password"
              type="password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E7E5E4] px-3 py-3 text-base outline-none transition focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#EAF1F7] md:py-2 md:text-sm"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full min-h-[44px] px-5 py-3 disabled:opacity-60">
            {submitting ? "Opretter..." : "Opret profil"}
          </button>
        </form>
      ) : null}
    </AuthSplitLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
          <div className="text-[#4A6478] text-sm">Indlæser invitation...</div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
