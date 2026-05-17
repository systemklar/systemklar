"use client";

import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
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

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "God morgen";
  if (hour < 18) return "God dag";
  return "God aften";
}

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await (supabase.auth.signInWithPassword as unknown as (args: {
      email: string;
      password: string;
    }) => Promise<{ error: { message: string } | null }>)({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(toDanishAuthError(error.message));
      setIsLoading(false);
      return;
    }

    const nextRaw = searchParams.get("next");
    const next = safeInternalPath(nextRaw);
    const dest = next && next.startsWith("/portal") ? next : "/portal";
    router.push(dest);
    router.refresh();
  };

  return (
    <AuthSplitLayout>
      <p className="mb-2 text-sm text-[#9AAAC8]">{getTimeGreeting()}</p>
      <AuthPageHeading title="Velkommen tilbage" subtitle="Log ind på din Systemklar konto" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField id="email" label="E-mail">
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="dig@firma.dk"
          />
        </AuthField>

        <AuthField id="password" label="Adgangskode">
          <div className="relative">
            <AuthInput
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[#9AAAC8] hover:text-[#2A4868]"
              aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AuthField>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[#2952A3] hover:text-[#1E4490]">
            Glemt adgangskode?
          </Link>
        </div>

        {errorMessage ? <AuthFormError>{errorMessage}</AuthFormError> : null}

        <AuthSubmitButton loading={isLoading} loadingLabel="Logger ind...">
          Log ind
        </AuthSubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-[#6A82A8]">
        Ikke oprettet endnu?{" "}
        <Link href="/kontakt" className="font-medium text-[#2952A3] hover:text-[#1E4490]">
          Book en demo →
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-[#6A82A8]">
          Indlæser...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
