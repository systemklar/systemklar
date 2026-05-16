import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 border-b border-sky-100 pb-3 text-lg font-semibold text-[#0D1F2D]">
        {title}
      </h2>
      {children}
      {footer ? (
        <div className="mt-4 flex justify-end border-t border-sky-50 pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
