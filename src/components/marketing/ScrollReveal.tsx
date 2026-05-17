"use client";

import { type ReactNode, useEffect, useRef } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  staggerMs?: number;
  className?: string;
};

/** Scroll-triggered fade-up: 20px → 0, 500ms ease-out. */
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
      className={`marketing-reveal ${className}`.trim()}
      style={staggerMs ? { transitionDelay: `${staggerMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
