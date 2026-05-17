"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PortalModalOverlay } from "@/components/portal/PortalOverlay";
import {
  getSelfServiceSetupConfig,
  totalSetupSteps,
} from "@/lib/system-self-service-setup";

type SystemCredentialSetupModalProps = {
  systemName: string;
  friendlyName: string;
  organisationId: string;
  onClose: () => void;
  onVerified: () => void;
};

export function SystemCredentialSetupModal({
  systemName,
  friendlyName,
  organisationId,
  onClose,
  onVerified,
}: SystemCredentialSetupModalProps) {
  const config = useMemo(() => getSelfServiceSetupConfig(systemName), [systemName]);
  const stepCount = totalSetupSteps(systemName);
  const instructionCount = config?.instructionSteps.length ?? 0;

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of config?.fields ?? []) init[f.key] = "";
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!config) return null;

  const isFormStep = step === instructionCount;
  const isSuccessStep = success;

  const progressTotal = stepCount;
  const progressCurrent = isSuccessStep ? progressTotal : step + 1;

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (step < instructionCount) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const saveRes = await fetch("/api/portal/systems/credentials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, organisationId, fields: values }),
      });
      const saveJson = (await saveRes.json().catch(() => ({}))) as { error?: string };
      if (!saveRes.ok) {
        setError(saveJson.error ?? "Kunne ikke gemme nøglerne.");
        return;
      }

      const verifyRes = await fetch("/api/portal/systems/verify-credential", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, organisationId }),
      });
      const verifyJson = (await verifyRes.json().catch(() => ({}))) as {
        verified?: boolean;
        error?: string;
      };

      if (!verifyRes.ok || !verifyJson.verified) {
        setError(
          verifyJson.error ?? "Nøglen kunne ikke verificeres. Tjek at du har kopieret den korrekt.",
        );
        return;
      }

      setSuccess(true);
      onVerified();
    } catch {
      setError("Netværksfejl. Prøv igen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalModalOverlay open onClose={onClose} position="bottom-sheet">
      <div
        className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-[#C8D8E4] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#C8D8E4] px-6 py-4">
          <div>
            <h2 id="credential-setup-title" className="text-lg font-semibold text-[#1E3448]">
              Opsætning af {friendlyName}
            </h2>
            {!isSuccessStep ? (
              <p className="mt-1 text-xs text-[#7A9AB0]">
                Trin {progressCurrent} af {progressTotal}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#7A9AB0] transition-colors hover:bg-[#F7F4EF] hover:text-[#1E3448]"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 px-6 pt-4">
          {Array.from({ length: progressTotal }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < progressCurrent ? "bg-[#4A7FA5]" : "bg-[#C8D8E4]"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isSuccessStep ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-5 w-5 text-[#5A9A6A]" strokeWidth={2.5} aria-hidden />
              </div>
              <p className="text-lg font-semibold text-[#5A9A6A]">Forbindelsen er oprettet</p>
              <p className="mt-2 text-sm text-[#4A6478]">
                Vi kan nu hente data fra {friendlyName}. Du kan lukke denne guide.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 rounded-full bg-[#4A7FA5] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3A6F95]"
              >
                Luk
              </button>
            </div>
          ) : isFormStep ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#1E3448]">Indtast dine oplysninger</p>
              {config.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-[#4A6478]">{field.label}</span>
                  <input
                    type={field.sensitive ? "password" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-[#C8D8E4] py-2.5 px-3 text-sm text-[#1E3448] outline-none ring-[#4A7FA5]/30 focus:border-[#4A7FA5] focus:ring-2"
                  />
                </label>
              ))}
              {config.helpUrl ? (
                <p className="text-sm">
                  <a
                    href={config.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#4A7FA5] underline-offset-2 hover:underline"
                  >
                    Se vejledning hos leverandøren
                  </a>
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[#4A6478]">{config.instructionSteps[step]}</p>
              {config.helpUrl && step === 0 ? (
                <p className="text-sm">
                  <a
                    href={config.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#4A7FA5] underline-offset-2 hover:underline"
                  >
                    Se vejledning hos leverandøren
                  </a>
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!isSuccessStep ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C8D8E4] px-6 py-4">
            <button
              type="button"
              onClick={step === 0 ? onClose : handleBack}
              disabled={busy}
              className="rounded-full border border-[#C8D8E4] px-4 py-2 text-sm font-semibold text-[#4A6478] transition hover:bg-[#F7F4EF] disabled:opacity-50"
            >
              {step === 0 ? "Annuller" : "Tilbage"}
            </button>
            {isFormStep ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmit()}
                className="rounded-full bg-[#4A7FA5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3A6F95] disabled:opacity-50"
              >
                {busy ? "Gemmer…" : "Gem og verificér"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-[#4A7FA5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3A6F95]"
              >
                Næste
              </button>
            )}
          </div>
        ) : null}
      </div>
    </PortalModalOverlay>
  );
}
