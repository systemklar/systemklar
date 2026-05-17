import type { ReactNode } from "react";
import Link from "next/link";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { RotatingValueProps } from "@/components/auth/RotatingValueProps";

type AuthSplitLayoutProps = {
  children: ReactNode;
  /** Top-right slot on the white panel (e.g. kontakt link on login) */
  topRight?: ReactNode;
};

export function AuthSplitLayout({ children, topRight }: AuthSplitLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-white text-[#0A1628]">
      {/* Mobile: slim navy header */}
      <header className="flex h-[60px] items-center border-b border-[#071020] bg-[#0A1628] px-6 md:hidden">
        <SystemklarLogo href="/" variant="dark" size="sm" />
      </header>

      <div className="grid min-h-[calc(100dvh-60px)] md:min-h-screen md:grid-cols-2">
        {/* Left: branding (desktop) */}
        <aside className="relative hidden flex-col overflow-hidden bg-[#0A1628] px-10 py-10 md:flex">
          <div className="auth-bg-drift" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-[1] flex-shrink-0">
            <SystemklarLogo href="/" variant="dark" size="sm" />
          </div>

          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center py-12">
            <RotatingValueProps />
          </div>

          <p className="relative z-[1] flex-shrink-0 text-xs text-[#6A82A8]">© {year} systemklar</p>
        </aside>

        {/* Right: form */}
        <section className="auth-panel-enter flex min-h-full flex-col bg-white">
          {topRight ? (
            <div className="flex flex-shrink-0 justify-end px-6 pt-6 md:px-10 md:pt-8">
              {topRight}
            </div>
          ) : null}

          <div
            className={`flex flex-1 flex-col items-center justify-center px-6 pb-10 md:px-10 md:pb-12 ${
              topRight ? "pt-4" : "pt-10 md:pt-12"
            }`}
          >
            <div className="w-full max-w-[380px]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthPageHeading({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <header className="mb-8">
      {badge ? (
        <p className="mb-3 inline-block rounded-full border border-[#CBD5E8] bg-[#E8EEFC] px-3 py-1 text-xs font-medium text-[#2952A3]">
          {badge}
        </p>
      ) : null}
      <h1 className="text-2xl font-normal tracking-tight text-[#0A1628]">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-[#6A82A8]">{subtitle}</p> : null}
    </header>
  );
}

export function AuthBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mt-6 inline-block text-sm text-[#2952A3] hover:text-[#1E4490]">
      {children}
    </Link>
  );
}
