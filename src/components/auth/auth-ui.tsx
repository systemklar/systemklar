"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";
import { Loader2 } from "lucide-react";

export const authInputClass =
  "w-full rounded-xl border border-[#CBD5E8] bg-white px-4 py-3 text-sm text-[#0A1628] outline-none transition placeholder:text-[#9AAAC8] focus:border-[#2952A3] focus:ring-[3px] focus:ring-[rgba(41,82,163,0.15)]";

export const authInputErrorClass =
  "w-full rounded-xl border border-[#E05040] bg-white px-4 py-3 text-sm text-[#0A1628] outline-none transition placeholder:text-[#9AAAC8] focus:border-[#E05040] focus:ring-[3px] focus:ring-[rgba(224,80,64,0.15)]";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
};

/** Legacy wrapper — prefer AuthFloatingField for inputs. */
export function AuthField({ id, label, error, children }: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#2A4868]">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-[#E05040]">{error}</p> : null}
    </div>
  );
}

type AuthFloatingFieldProps = {
  id?: string;
  label: string;
  error?: string | null;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthFloatingField({
  id: idProp,
  label,
  error,
  className = "",
  value,
  defaultValue,
  ...props
}: AuthFloatingFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [focused, setFocused] = useState(false);
  const hasValue =
    (value !== undefined && String(value).length > 0) ||
    (defaultValue !== undefined && String(defaultValue).length > 0);

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        defaultValue={defaultValue}
        placeholder=" "
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`${error ? authInputErrorClass : authInputClass} ${className}`.trim()}
        {...props}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 text-[#6A82A8] transition-all duration-150 ${
          focused || hasValue
            ? "top-2 text-[10px] font-medium text-[#2952A3]"
            : "top-1/2 -translate-y-1/2 text-sm"
        }`}
      >
        {label}
      </label>
      {error ? <p className="mt-1.5 text-sm text-[#E05040]">{error}</p> : null}
    </div>
  );
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function AuthInput({ hasError, className = "", ...props }: AuthInputProps) {
  return (
    <input
      className={`${hasError ? authInputErrorClass : authInputClass} ${className}`.trim()}
      {...props}
    />
  );
}

type AuthSubmitButtonProps = {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
};

export function AuthSubmitButton({
  children,
  loading = false,
  loadingLabel,
  ...props
}: AuthSubmitButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2952A3] text-sm font-medium text-white transition-colors hover:bg-[#1E4490] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span>{loadingLabel ?? "Vent..."}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthSuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-[#B0E8D0] bg-[#E8FAF4] px-4 py-3 text-sm text-[#0A6A4A]">
      {children}
    </p>
  );
}

export function AuthFormError({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[#E05040]">{children}</p>;
}
