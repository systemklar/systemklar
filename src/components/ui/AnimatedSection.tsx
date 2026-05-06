"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
};

export function AnimatedSection({ children, className = "", delay = 0, direction = "up" }: Props) {
  const { ref, inView } = useInView();

  const base = "transition-all duration-700 ease-out";
  const hidden = {
    up: "opacity-0 translate-y-8",
    left: "opacity-0 -translate-x-8",
    right: "opacity-0 translate-x-8",
    fade: "opacity-0",
  }[direction];
  const visible = "opacity-100 translate-y-0 translate-x-0";
  const delayClass =
    {
      0: "delay-0",
      100: "delay-100",
      200: "delay-200",
      300: "delay-300",
    }[delay] ?? "delay-0";

  return (
    <div ref={ref} className={`${base} ${delayClass} ${inView ? visible : hidden} ${className}`.trim()}>
      {children}
    </div>
  );
}
