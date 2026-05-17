"use client";

import { useEffect, useState } from "react";
import { Bell, FileText, MessageSquare, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PROPS: { icon: LucideIcon; text: string }[] = [
  { icon: Monitor, text: "Automatisk IT-overvågning — 24/7" },
  { icon: Bell, text: "Besked med det samme når noget fejler" },
  { icon: FileText, text: "Månedlig IT-rapport til din bestyrelse" },
  { icon: MessageSquare, text: "Dansk support inden for 1 hverdag" },
];

const INTERVAL_MS = 4000;
const FADE_MS = 500;

export function RotatingValueProps() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimeout: number | undefined;
    const intervalId = window.setInterval(() => {
      setVisible(false);
      fadeTimeout = window.setTimeout(() => {
        setIndex((i) => (i + 1) % PROPS.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (fadeTimeout !== undefined) window.clearTimeout(fadeTimeout);
    };
  }, []);

  const { icon: Icon, text } = PROPS[index];

  return (
    <div
      className="auth-value-prop flex flex-col items-center text-center transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
      aria-live="polite"
    >
      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} aria-hidden />
      <p className="mt-5 max-w-xs text-xl font-light leading-snug text-white">{text}</p>
    </div>
  );
}
