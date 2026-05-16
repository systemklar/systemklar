"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

function NavigationProgressPulse() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase(1));
    });
    const t1 = window.setTimeout(() => setPhase(2), 260);
    const t2 = window.setTimeout(() => setPhase(3), 420);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const scale =
    phase === 0 ? 0.02 : phase === 1 ? 0.88 : phase === 2 ? 1 : 1;
  const opacity = phase === 3 ? 0 : 1;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[2px] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full origin-left bg-[#3B9EDB]"
        style={{
          transform: `scaleX(${scale})`,
          opacity,
          transition:
            phase === 0
              ? "none"
              : "transform 320ms cubic-bezier(0.33, 1, 0.68, 1), opacity 160ms ease-out",
        }}
      />
    </div>
  );
}

/**
 * Slim top bar during SPA navigations — CSS transitions only (nprogress-style).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const skipFirstRouteEffect = useRef(true);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (skipFirstRouteEffect.current) {
      skipFirstRouteEffect.current = false;
      return;
    }
    setPulse((p) => p + 1);
  }, [pathname]);

  return pulse === 0 ? null : <NavigationProgressPulse key={pulse} />;
}

/**
 * Fade + subtle lift on route change (main column only — not sidebar).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-shell flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
