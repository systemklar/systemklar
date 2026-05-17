"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";
import { Loader2 } from "lucide-react";

export const authInputClass =
  "peer w-full rounded-xl border border-[#C8D8E4] bg-white px-4 pb-3 pt-6 text-base text-[#1E3448] outline-none transition placeholder:text-transparent focus:border-[#4A7FA5] focus:ring-2 focus:ring-[rgba(74,127,165,0.2)] md:text-sm";

export const authInputErrorClass =
  "peer w-full rounded-xl border border-[#B85C4A] bg-white px-4 pb-3 pt-6 text-base text-[#1E3448] outline-none transition placeholder:text-transparent focus:border-[#B85C4A] focus:ring-2 focus:ring-[rgba(184,92,74,0.15)] md:text-sm";

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
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#4A6478]">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-[#B85C4A]">{error}</p> : null}
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
        className={`pointer-events-none absolute left-4 text-[#7A9AB0] transition-all duration-150 ${
          focused || hasValue
            ? "top-2 text-[10px] font-medium text-[#4A7FA5]"
            : "top-1/2 -translate-y-1/2 text-sm"
        }`}
      >
        {label}
      </label>
      {error ? <p className="mt-1.5 text-sm text-[#B85C4A]">{error}</p> : null}
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#4A7FA5] text-sm font-medium text-white transition-colors hover:bg-[#3A6F95] disabled:cursor-not-allowed disabled:opacity-60"
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
    <p className="rounded-xl border border-[#B8D8C0] bg-[#EEF7F0] px-4 py-3 text-sm text-[#3A7A4A]">
      {children}
    </p>
  );
}

export function AuthFormError({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[#B85C4A]">{children}</p>;
}
