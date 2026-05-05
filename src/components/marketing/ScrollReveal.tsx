"use client";

import { type ReactNode, useEffect, useRef } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  /** Forsinkelse af transition når elementet bliver synligt (stagger) */
  staggerMs?: number;
  className?: string;
};

export function ScrollReveal({ children, staggerMs = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${className}`.trim()}
      style={staggerMs ? { transitionDelay: `${staggerMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
