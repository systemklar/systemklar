"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  PORTAL_ONBOARDING_TOUR_STEPS,
  PORTAL_TOUR_OPEN_SIDEBAR_EVENT,
  type PortalOnboardingTourStep,
} from "@/components/portal/portal-onboarding-tour";

const SPOTLIGHT_SHADOW = "0 0 0 4px #0A6EBD, 0 0 0 9999px rgba(0,0,0,0.6)";
const TOOLTIP_GAP = 16;
const VIEWPORT_PAD = 16;

type Rect = { top: number; left: number; width: number; height: number };

function measureTarget(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function tooltipPosition(
  target: Rect,
  tooltipW: number,
  tooltipH: number,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = target.top + target.height + TOOLTIP_GAP;
  let left = target.left + target.width / 2 - tooltipW / 2;

  if (top + tooltipH > vh - VIEWPORT_PAD) {
    top = target.top - tooltipH - TOOLTIP_GAP;
  }
  if (top < VIEWPORT_PAD) {
    top = Math.min(target.top + target.height + TOOLTIP_GAP, vh - tooltipH - VIEWPORT_PAD);
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tooltipW - VIEWPORT_PAD));

  return { top, left };
}

type PortalOnboardingTourProps = {
  open: boolean;
  onComplete: () => void;
};

export function PortalOnboardingTour({ open, onComplete }: PortalOnboardingTourProps) {
  const steps = PORTAL_ONBOARDING_TOUR_STEPS;
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<Element | null>(null);

  const step: PortalOnboardingTourStep = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;

  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.classList.remove("portal-tour-target");
      highlightedRef.current = null;
    }
  }, []);

  const applyHighlight = useCallback(
    (selector: string) => {
      clearHighlight();
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.add("portal-tour-target");
      highlightedRef.current = el;
      el.scrollIntoView({ block: "nearest", behavior: "smooth", inline: "nearest" });
    },
    [clearHighlight],
  );

  const refreshGeometry = useCallback(() => {
    const rect = measureTarget(step.target);
    setTargetRect(rect);
    if (tooltipRef.current && rect) {
      const tr = tooltipRef.current.getBoundingClientRect();
      setTooltipPos(tooltipPosition(rect, tr.width, tr.height));
    }
  }, [step.target]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setTooltipVisible(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;

    if (stepIndex === steps.length - 1 && window.innerWidth < 768) {
      window.dispatchEvent(new CustomEvent(PORTAL_TOUR_OPEN_SIDEBAR_EVENT));
    }

    applyHighlight(step.target);

    const raf = requestAnimationFrame(() => {
      refreshGeometry();
    });

    const onScrollOrResize = () => refreshGeometry();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, mounted, stepIndex, step.target, applyHighlight, refreshGeometry, steps.length]);

  useLayoutEffect(() => {
    if (!open || !mounted || !targetRect || !tooltipRef.current) return;
    const tr = tooltipRef.current.getBoundingClientRect();
    setTooltipPos(tooltipPosition(targetRect, tr.width, tr.height));
  }, [open, mounted, targetRect, stepIndex, tooltipVisible]);

  useEffect(() => {
    if (!open) {
      clearHighlight();
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      clearHighlight();
    };
  }, [open, clearHighlight]);

  const finish = useCallback(() => {
    clearHighlight();
    onComplete();
  }, [clearHighlight, onComplete]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setTooltipVisible(false);
    window.setTimeout(() => {
      setStepIndex((i) => i + 1);
      setTooltipVisible(true);
    }, 150);
  }, [isLast, finish]);

  if (!open || !mounted) return null;

  const spotlightRadius =
    step.target.includes("portal-sidebar") ? 12 : 16;

  return createPortal(
    <div className="portal-onboarding-tour-root" role="presentation">
      <div className="fixed inset-0 z-50" aria-hidden onClick={(e) => e.preventDefault()} />

      {targetRect ? (
        <div
          className="pointer-events-none fixed z-[51] transition-all duration-150 ease-out"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: spotlightRadius,
            boxShadow: SPOTLIGHT_SHADOW,
          }}
          aria-hidden
        />
      ) : null}

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-tour-title"
        className={`pointer-events-auto fixed z-[53] w-[min(100vw-2rem,24rem)] max-w-sm rounded-2xl border border-sky-100 bg-white p-6 shadow-xl transition-opacity duration-150 ${
          tooltipVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <button
          type="button"
          onClick={finish}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[#7AAEC8] transition hover:bg-sky-50 hover:text-[#0D1F2D]"
          aria-label="Spring tour over"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <p className="text-xs font-medium text-[#7AAEC8]">
          Trin {stepIndex + 1} af {steps.length}
        </p>
        <h2 id="portal-tour-title" className="mt-2 pr-6 text-lg font-semibold text-[#0D1F2D]">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#2C4A5E]">{step.text}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#2C4A5E] transition hover:bg-sky-50 hover:text-[#0D1F2D]"
          >
            Spring over
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#0A6EBD] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0]"
          >
            {isLast ? "Kom i gang →" : "Næste →"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
