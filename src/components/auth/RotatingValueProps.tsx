"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, FileText, MessageSquare, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PROPS: { icon: LucideIcon; text: string }[] = [
  { icon: Monitor, text: "Automatisk IT-overvågning — 24/7" },
  { icon: Bell, text: "Besked med det samme når noget fejler" },
  { icon: FileText, text: "Månedlig IT-rapport til din bestyrelse" },
  { icon: MessageSquare, text: "Dansk support inden for 1 hverdag" },
];

const INTERVAL_MS = 4000;
const ANIM_MS = 400;

export function RotatingValueProps() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exit">("idle");
  const [displayIndex, setDisplayIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPhase("exit");
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => {
          const next = (i + 1) % PROPS.length;
          setDisplayIndex(next);
          return next;
        });
        setPhase("idle");
      }, ANIM_MS);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const { icon: Icon, text } = PROPS[displayIndex];

  return (
    <div
      className="relative flex min-h-[120px] flex-col items-center justify-center text-center"
      aria-live="polite"
    >
      <div
        key={displayIndex}
        className={`flex flex-col items-center ${phase === "exit" ? "auth-value-exit" : "auth-value-enter"}`}
      >
        <Icon
          className={`h-8 w-8 text-white ${phase === "exit" ? "" : "auth-value-icon-enter"}`}
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="mt-5 max-w-xs text-xl font-light leading-snug text-white">{text}</p>
      </div>
    </div>
  );
}
