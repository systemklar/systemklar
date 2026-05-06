import type { ReactNode } from "react";
import { SystemklarLogo } from "@/components/branding/SystemklarLogo";

type AuthSplitLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden>
      <path d="M4.5 10.5 8 14l7.5-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <main className="min-h-screen bg-white text-[#0D1F2D]">
      <div className="grid min-h-screen md:grid-cols-2">
        <aside className="hidden bg-sky-600 px-10 py-12 md:flex md:flex-col md:justify-between">
          <div>
            <SystemklarLogo
              href="/"
              textClassName="text-sm font-bold tracking-tight text-white"
              iconColor="#FFFFFF"
              iconSecondaryOpacity={0.55}
            />
            <h2 className="mt-12 max-w-md text-4xl font-bold tracking-tight text-white">
              Få overblik over din virksomheds IT
            </h2>
            <ul className="mt-8 space-y-4 text-sky-100">
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span>Support og sager samlet ét sted</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span>Live systemovervågning</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span>AI-drevne IT-rapporter</span>
              </li>
            </ul>
          </div>
        </aside>
        <section className="flex items-center justify-center px-6 py-12 md:px-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-[#0D1F2D]">{title}</h1>
            <p className="mt-3 text-sm text-[#4A8CB5]">{subtitle}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
