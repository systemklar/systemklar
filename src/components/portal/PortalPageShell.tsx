import type { ReactNode } from "react";

type PortalPageShellProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PortalPageShell({
  title,
  subtitle,
  action,
  children,
  className = "",
}: PortalPageShellProps) {
  return (
    <div className={`w-full space-y-8 p-6 md:p-8 ${className}`.trim()}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0A1628] md:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-[#2A4868]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </div>
  );
}
