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
    ? "fade-in-up mb-6 inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-4 py-2 text-sm font-medium text-[#6B6B6B] mx-auto"
    : "fade-in-up mb-6 inline-flex rounded-full border border-gray-100 bg-[#F7F7F5] px-4 py-2 text-sm font-medium text-[#6B6B6B]";

  const h1Cls = centered
    ? "fade-in-up mx-auto max-w-3xl text-center text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-5xl md:leading-tight"
    : "fade-in-up max-w-3xl text-4xl font-bold tracking-tight text-[#0A0A0A] md:text-5xl md:leading-tight";

  const descCls = centered
    ? "fade-in-up mx-auto mt-6 max-w-2xl text-center text-xl text-gray-500"
    : "fade-in-up mt-6 max-w-2xl text-xl text-gray-500";

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
