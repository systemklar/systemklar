import type { ReactNode } from "react";

type SettingsRowProps = {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  last?: boolean;
};

export function SettingsRow({ label, description, children, last }: SettingsRowProps) {
  return (
    <div
      className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
        last ? "" : "border-b border-[#E0EAF0]"
      }`}
    >
      <div className="min-w-0 flex-1 pr-0 sm:pr-6">
        <p className="text-sm font-medium text-[#1E3448]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[#7A9AB0]">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 sm:text-right">{children}</div>
    </div>
  );
}
