"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  PORTAL_ONBOARDING_TOUR_STEPS,
  PORTAL_TOUR_OPEN_SIDEBAR_EVENT,
  type PortalOnboardingTourStep,
} from "@/components/portal/portal-onboarding-tour";

const SPOTLIGHT_RING =
  "0 0 0 6px #0A6EBD, 0 0 0 12px rgba(10,110,189,0.2)";
const SCRIM_COLOR = "rgba(15, 23, 42, 0.7)";
const TOOLTIP_GAP = 16;
const VIEWPORT_PAD = 16;
const TOOLTIP_MOVE_MS = 400;
const TOOLTIP_ENTER_MS = 300;

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

/** Fire scrim panels around a rectangular hole — no backdrop-blur on the page. */
function TourScrim({ rect }: { rect: Rect | null }) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: SCRIM_COLOR }}
        aria-hidden
      />
    );
  }

  const pad = 8;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const width = rect.width + pad * 2;
  const height = rect.height + pad * 2;
  const bottom = top + height;
  const right = left + width;

  const panelClass = "fixed z-50 pointer-events-auto";

  return (
    <>
      <div
        className={panelClass}
        style={{ top: 0, left: 0, right: 0, height: top, backgroundColor: SCRIM_COLOR }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ top, left: 0, width: left, height, backgroundColor: SCRIM_COLOR }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ top, left: right, right: 0, height, backgroundColor: SCRIM_COLOR }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ top: bottom, left: 0, right: 0, bottom: 0, backgroundColor: SCRIM_COLOR }}
        aria-hidden
      />
    </>
  );
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
  const [tooltipEntering, setTooltipEntering] = useState(true);
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
    setTooltipEntering(true);
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
  }, [open, mounted, targetRect, stepIndex]);

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
    setTooltipEntering(false);
    window.setTimeout(() => {
      setStepIndex((i) => i + 1);
      setTooltipEntering(true);
    }, 120);
  }, [isLast, finish]);

  if (!open || !mounted) return null;

  const spotlightRadius = step.target.includes("portal-sidebar") ? 12 : 16;
  const pad = 8;
  const ringRect = targetRect
    ? {
        top: Math.max(0, targetRect.top - pad),
        left: Math.max(0, targetRect.left - pad),
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  return createPortal(
    <div className="portal-onboarding-tour-root" role="presentation">
      <TourScrim rect={targetRect} />

      {ringRect ? (
        <div
          className="pointer-events-none fixed z-[51]"
          style={{
            top: ringRect.top,
            left: ringRect.left,
            width: ringRect.width,
            height: ringRect.height,
            borderRadius: spotlightRadius,
            boxShadow: SPOTLIGHT_RING,
            transition: `top ${TOOLTIP_MOVE_MS}ms ease-in-out, left ${TOOLTIP_MOVE_MS}ms ease-in-out, width ${TOOLTIP_MOVE_MS}ms ease-in-out, height ${TOOLTIP_MOVE_MS}ms ease-in-out`,
          }}
          aria-hidden
        />
      ) : null}

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-tour-title"
        className="pointer-events-auto fixed z-[52] w-[min(calc(100vw-2rem),28rem)] max-w-md rounded-3xl border border-sky-100/80 bg-white p-8 shadow-2xl ease-out"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: `top ${TOOLTIP_MOVE_MS}ms ease-in-out, left ${TOOLTIP_MOVE_MS}ms ease-in-out, opacity ${TOOLTIP_ENTER_MS}ms ease-out, transform ${TOOLTIP_ENTER_MS}ms ease-out`,
          opacity: tooltipEntering ? 1 : 0,
          transform: tooltipEntering ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#7AAEC8] transition hover:bg-sky-50 hover:text-[#0D1F2D]"
          aria-label="Spring tour over"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
          Trin {stepIndex + 1} af {steps.length}
        </p>

        <div className="mt-4 flex gap-2" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === stepIndex ? "bg-[#0A6EBD]" : "border border-sky-200 bg-transparent"
              }`}
            />
          ))}
        </div>

        <h2 id="portal-tour-title" className="mt-5 pr-8 text-2xl font-light text-[#0D1F2D]">
          {step.title}
        </h2>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-[#2C4A5E]">{step.text}</p>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-[#7AAEC8] transition hover:text-[#0D1F2D]"
          >
            Spring over
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#0A6EBD] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0859A0]"
          >
            {isLast ? "Kom i gang →" : "Næste →"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
