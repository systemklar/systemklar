"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const FEATURE_SETS: string[][] = [
  [
    "Se status på alle dine systemer",
    "Opret og følg supportssager",
    "Modtag månedlige IT-rapporter",
  ],
  [
    "Samlet IT-overblik på ét sted",
    "Svar fra support inden for 1 hverdag",
    "Ingen binding – opsig når som helst",
  ],
  [
    "Sikker kodebank til alle logins",
    "Dansk support der forstår din forretning",
    "Kom i gang på under 10 minutter",
  ],
];

const ROTATION_INTERVAL_MS = 4000;
const FADE_DURATION_MS = 300;

export function RotatingFeatureList() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let swapTimeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setVisible(false);
      swapTimeoutId = window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % FEATURE_SETS.length);
        setVisible(true);
      }, FADE_DURATION_MS);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (swapTimeoutId !== null) {
        window.clearTimeout(swapTimeoutId);
      }
    };
  }, []);

  return (
    <ul
      className="mt-8 space-y-4 text-sky-100 transition-[opacity,transform] ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        transitionDuration: `${FADE_DURATION_MS}ms`,
      }}
      aria-live="polite"
    >
      {FEATURE_SETS[activeIndex].map((bullet) => (
        <li key={bullet} className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-white" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}
