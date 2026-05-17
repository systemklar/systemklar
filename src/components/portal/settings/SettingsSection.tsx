import type { ReactNode } from "react";

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-sm">
      {title ? (
        <h2 className="mb-4 border-b border-[#D4C9A8] pb-3 text-lg font-semibold text-[#2C3020]">
          {title}
        </h2>
      ) : null}
      {children}
      {footer ? (
        <div className="mt-4 flex justify-end border-t border-[#E8E2D0] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
