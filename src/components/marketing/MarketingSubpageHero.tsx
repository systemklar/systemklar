"use client";

import type { ReactNode } from "react";

type Props = {
  badge?: string;
  title: string;
  /** Undertitel / brødtekst under hero (kan være string eller node) */
  description?: ReactNode;
  children?: ReactNode;
  /** Centrer tekst og max-width blokke — fx forsiden-/prisersider */
  centered?: boolean;
};

/**
 * Fade-in stagger ved load — samme mønster som forsiden (fade-in-up + delays).
 */
export function MarketingSubpageHero({ badge, title, description, children, centered = false }: Props) {
  const alignBadge = centered
    ? "fade-in-up mb-6 mx-auto inline-flex rounded-full border border-[#E4EAF5] bg-[#E8EEFC] px-4 py-2 text-sm font-medium text-[#2952A3]"
    : "fade-in-up mb-6 inline-flex rounded-full border border-[#E4EAF5] bg-[#E8EEFC] px-4 py-2 text-sm font-medium text-[#2952A3]";

  const h1Cls = centered
    ? "marketing-hero-title fade-in-up mx-auto max-w-3xl text-center leading-[1.15] md:leading-tight"
    : "marketing-hero-title fade-in-up max-w-3xl leading-[1.15] md:leading-tight";

  const descCls = centered
    ? "fade-in-up mx-auto mt-6 max-w-2xl text-center text-xl text-[#2A4868]"
    : "fade-in-up mt-6 max-w-2xl text-xl text-[#2A4868]";

  const childCls = centered ? "fade-in-up mt-10 flex flex-wrap justify-center gap-3" : "fade-in-up mt-10";

  return (
    <div className={centered ? "text-center" : undefined}>
      {badge ? (
        <p className={alignBadge} style={{ animationDelay: "0ms" }}>
          {badge}
        </p>
      ) : null}
      <h1 className={h1Cls} style={{ animationDelay: badge ? "80ms" : "0ms" }}>
        {title}
      </h1>
      {description ? (
        <div className={descCls} style={{ animationDelay: badge ? "160ms" : "80ms" }}>
          {description}
        </div>
      ) : null}
      {children ? (
        <div className={childCls} style={{ animationDelay: badge ? "240ms" : "160ms" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
