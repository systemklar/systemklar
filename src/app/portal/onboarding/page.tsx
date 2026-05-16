"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemklarLogo } from "@/components/branding/SystemklarLogo";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { needsOnboarding, onboardingFirstName } from "@/lib/onboarding";
import { ONBOARDING_SYSTEM_GROUPS, systemNameById } from "@/lib/onboarding-systems";
import { createClient } from "@/lib/supabase";

function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= n ? "bg-[#0A6EBD]" : "bg-sky-100"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-[#4A8CB5]">Trin {step} af 3</p>
    </div>
  );
}

type OnboardingContentProps = {
  profileId: string;
  fullName: string | null;
};

function OnboardingContent({ profileId, fullName }: OnboardingContentProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = onboardingFirstName(fullName);

  const toggleSystem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completeOnboarding = async () => {
    setSaving(true);
    setError(null);

    const systemNames = Array.from(selected).map((id) => systemNameById(id));
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        onboarding_systems: systemNames,
        onboarding_completed: true,
      })
      .eq("id", profileId);

    setSaving(false);

    if (updateError) {
      console.error("[onboarding] complete", updateError);
      setError(updateError.message ?? "Kunne ikke gemme. Prøv igen.");
      return;
    }

    router.replace("/portal");
    router.refresh();
  };

  return (
    <div className="w-full max-w-[640px]">
      <OnboardingProgress step={step} />

      {step === 1 ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D]">
            Velkommen til Systemklar, {firstName}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#2C4A5E]">
            Vi overvåger din IT så du ikke behøver. Lad os starte med at lære din virksomhed at
            kende.
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-8 w-full rounded-full bg-[#0A6EBD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0859A0] sm:w-auto"
          >
            Kom i gang →
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D]">Hvilke systemer bruger I?</h1>
          <p className="mt-2 text-sm text-[#4A8CB5]">
            Vælg de systemer din virksomhed bruger. Du kan altid tilføje flere senere.
          </p>

          <div className="mt-6 space-y-6">
            {ONBOARDING_SYSTEM_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4A8CB5]">
                  {group.label}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.systems.map((system) => {
                    const isSelected = selected.has(system.id);
                    const Icon = system.icon;
                    return (
                      <button
                        key={system.id}
                        type="button"
                        onClick={() => toggleSystem(system.id)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                          isSelected
                            ? "border-sky-300 bg-sky-50 text-[#0D1F2D] ring-1 ring-sky-200"
                            : "border-sky-100 bg-white text-[#2C4A5E] hover:border-sky-200 hover:bg-sky-50/50"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? "bg-[#0A6EBD] text-white" : "bg-sky-50 text-sky-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 font-medium">{system.name}</span>
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => setStep(3)}
            className="mt-8 w-full rounded-full bg-[#0A6EBD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0859A0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Fortsæt →
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#0D1F2D]">Perfekt, {firstName}!</h1>
          <p className="mt-4 text-sm leading-relaxed text-[#2C4A5E]">
            Vi har gemt dine systemer. Benjamin fra Systemklar kontakter dig inden for 24 timer for at
            færdiggøre opsætningen.
          </p>
          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void completeOnboarding()}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0A6EBD] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0859A0] disabled:opacity-50 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Gemmer…
              </>
            ) : (
              "Gå til dit dashboard →"
            )}
          </button>
        </section>
      ) : null}
    </div>
  );
}

export default function PortalOnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const profile = await fetchCurrentProfile(supabase, session.user.id);
      if (cancelled) return;

      if (!needsOnboarding(profile?.onboarding_completed)) {
        router.replace("/portal");
        return;
      }

      if (!profile?.id) {
        setBootstrapError(
          "Din profil blev ikke fundet. Kontakt support på kontakt@systemklar.dk.",
        );
        setBootstrapping(false);
        return;
      }

      setProfileId(profile.id);
      setFullName(profile.full_name);
      setBootstrapping(false);
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (bootstrapping) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4">
        <p className="text-sm text-[#4A8CB5]">Indlæser...</p>
      </main>
    );
  }

  if (bootstrapError || !profileId) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4">
        <p className="max-w-md text-center text-sm text-red-700">{bootstrapError ?? "Noget gik galt."}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col px-4 pb-12 pt-8 md:px-8 md:pt-10">
      <header className="mx-auto flex w-full max-w-[640px] justify-center pb-8 md:justify-start">
        <SystemklarLogo variant="light" textClassName="text-base font-bold tracking-tight text-sky-700" />
      </header>

      <div className="mx-auto flex w-full flex-1 flex-col items-center">
        <OnboardingContent profileId={profileId} fullName={fullName} />
      </div>
    </main>
  );
}
