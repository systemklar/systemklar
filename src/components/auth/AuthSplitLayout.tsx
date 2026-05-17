import type { ReactNode } from "react";
import { CheckCircle } from "lucide-react";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { RotatingFeatureList } from "@/components/auth/RotatingFeatureList";

type AuthSplitLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  sideTitle?: string;
  sideBullets?: string[];
};

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  sideTitle = "Få overblik over din virksomheds IT",
  sideBullets,
}: AuthSplitLayoutProps) {
  return (
    <main className="min-h-screen bg-white text-[#1E3448]">
      <div className="grid min-h-screen md:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#4A7FA5] to-[#1E3448] px-10 py-12 md:flex md:flex-col md:justify-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            aria-hidden
          />
          <AnimatedSection direction="left" delay={100} className="relative z-10 mx-auto w-full max-w-md">
            <SystemklarLogo href="/" variant="dark" size="sm" />
            <h2 className="mt-10 max-w-md text-4xl font-bold tracking-tight text-white">{sideTitle}</h2>
            {sideBullets ? (
              <ul className="mt-8 space-y-4 text-[#EAF1F7]">
                {sideBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <RotatingFeatureList />
            )}
          </AnimatedSection>
        </aside>
        <section className="flex items-center justify-center bg-[#F7F4EF] px-6 py-12 md:px-10">
          <AnimatedSection direction="right" delay={0} className="w-full max-w-md rounded-2xl border border-[#C8D8E4] bg-white p-8 shadow-sm">
            <div className="mb-5 flex justify-center">
              <SystemklarLogo href="/" variant="light" size="sm" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1E3448]">{title}</h1>
            <p className="mt-3 text-sm text-[#4A6478]">{subtitle}</p>
            {children}
          </AnimatedSection>
        </section>
      </div>
    </main>
  );
}
