"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
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
  const [visible, setVisible] = useState<Record<string, boolean>>({});
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

  const toggleVisible = (key: string) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
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
        className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-sky-100 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#D0E8F5] px-6 py-4">
          <div>
            <h2 id="credential-setup-title" className="text-lg font-semibold text-[#0D1F2D]">
              Opsætning af {friendlyName}
            </h2>
            {!isSuccessStep ? (
              <p className="mt-1 text-xs text-[#7AAEC8]">
                Trin {progressCurrent} af {progressTotal}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#7AAEC8] transition-colors hover:bg-[#F5FAFD] hover:text-[#0D1F2D]"
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
                i < progressCurrent ? "bg-[#0A6EBD]" : "bg-[#D0E8F5]"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isSuccessStep ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-5 w-5 text-[#0A7C5C]" strokeWidth={2.5} aria-hidden />
              </div>
              <p className="text-lg font-semibold text-[#0A7C5C]">Forbindelsen er oprettet</p>
              <p className="mt-2 text-sm text-[#2C4A5E]">
                Vi kan nu hente data fra {friendlyName}. Du kan lukke denne guide.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 rounded-full bg-[#0A6EBD] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0]"
              >
                Luk
              </button>
            </div>
          ) : isFormStep ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#0D1F2D]">Indtast dine oplysninger</p>
              {config.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-[#2C4A5E]">{field.label}</span>
                  <div className="relative mt-1">
                    <input
                      type={field.sensitive && !visible[field.key] ? "password" : "text"}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full rounded-xl border border-[#D0E8F5] py-2.5 pl-3 pr-10 text-sm text-[#0D1F2D] outline-none ring-[#0A6EBD]/30 focus:border-[#0A6EBD] focus:ring-2"
                    />
                    {field.sensitive ? (
                      <button
                        type="button"
                        onClick={() => toggleVisible(field.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#7AAEC8] hover:text-[#0D1F2D]"
                        aria-label={visible[field.key] ? "Skjul" : "Vis"}
                      >
                        {visible[field.key] ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    ) : null}
                  </div>
                </label>
              ))}
              {config.helpUrl ? (
                <p className="text-sm">
                  <a
                    href={config.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#0A6EBD] underline-offset-2 hover:underline"
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
              <p className="text-sm leading-relaxed text-[#2C4A5E]">{config.instructionSteps[step]}</p>
              {config.helpUrl && step === 0 ? (
                <p className="text-sm">
                  <a
                    href={config.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#0A6EBD] underline-offset-2 hover:underline"
                  >
                    Se vejledning hos leverandøren
                  </a>
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!isSuccessStep ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D0E8F5] px-6 py-4">
            <button
              type="button"
              onClick={step === 0 ? onClose : handleBack}
              disabled={busy}
              className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-[#2C4A5E] transition hover:bg-[#F5FAFD] disabled:opacity-50"
            >
              {step === 0 ? "Annuller" : "Tilbage"}
            </button>
            {isFormStep ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmit()}
                className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0] disabled:opacity-50"
              >
                {busy ? "Gemmer…" : "Gem og verificér"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-[#0A6EBD] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0859A0]"
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
