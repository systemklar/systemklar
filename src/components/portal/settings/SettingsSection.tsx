import type { ReactNode } from "react";

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-sm">
      {title ? (
        <h2 className="mb-4 border-b border-[#C8D8E4] pb-3 text-lg font-semibold text-[#1E3448]">
          {title}
        </h2>
      ) : null}
      {children}
      {footer ? (
        <div className="mt-4 flex justify-end border-t border-[#E0EAF0] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
