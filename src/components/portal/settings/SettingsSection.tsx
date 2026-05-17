import type { ReactNode } from "react";

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-[#CBD5E8] bg-white p-6 shadow-sm">
      {title ? (
        <h2 className="mb-4 border-b border-[#CBD5E8] pb-3 text-lg font-semibold text-[#0A1628]">
          {title}
        </h2>
      ) : null}
      {children}
      {footer ? (
        <div className="mt-4 flex justify-end border-t border-[#E4EAF5] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
