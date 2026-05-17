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

const ROTATION_INTERVAL_MS = 6000;
const EXIT_DURATION_MS = 400;
const ENTER_DURATION_MS = 500;
const TRANSITION_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

type TransitionPhase = "entered" | "entering" | "exiting";

export function RotatingFeatureList() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("entered");

  useEffect(() => {
    let swapTimeoutId: number | null = null;
    let enterTimeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setPhase("exiting");
      swapTimeoutId = window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % FEATURE_SETS.length);
        setPhase("entering");
        enterTimeoutId = window.setTimeout(() => {
          setPhase("entered");
        }, 20);
      }, EXIT_DURATION_MS);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (swapTimeoutId !== null) {
        window.clearTimeout(swapTimeoutId);
      }
      if (enterTimeoutId !== null) {
        window.clearTimeout(enterTimeoutId);
      }
    };
  }, []);

  const isEntered = phase === "entered";
  const listTransform =
    phase === "exiting" ? "translateX(-40px)" : phase === "entering" ? "translateX(40px)" : "translateX(0)";
  const transitionDuration = phase === "exiting" ? EXIT_DURATION_MS : ENTER_DURATION_MS;

  return (
    <div className="mt-8">
      <ul
        className="space-y-4 text-base text-[#E8EEFC] transition-[opacity,transform]"
        style={{
          opacity: isEntered ? 1 : 0,
          transform: listTransform,
          transitionDuration: `${transitionDuration}ms`,
          transitionTimingFunction: TRANSITION_EASING,
        }}
        aria-live="polite"
      >
        {FEATURE_SETS[activeIndex].map((bullet) => (
          <li key={bullet} className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#6A92D8]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-2" aria-hidden>
        {FEATURE_SETS.map((_, index) => {
          const active = index === activeIndex;
          return (
            <span
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ${
                active ? "w-6 bg-white" : "w-2 bg-white/35"
              }`}
              style={{ transitionTimingFunction: TRANSITION_EASING }}
            />
          );
        })}
      </div>
    </div>
  );
}
