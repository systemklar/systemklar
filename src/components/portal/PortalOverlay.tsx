"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

/** Full-viewport backdrop — portaled to avoid broken `fixed` inside `.page-transition-shell`. */
export const PORTAL_OVERLAY_BACKDROP_CLASS =
  "fixed inset-0 top-0 right-0 bottom-0 left-0 z-[100] bg-slate-900/50 backdrop-blur-sm";

export const PORTAL_OVERLAY_PANEL_CLASS =
  "fixed inset-y-0 top-0 right-0 bottom-0 z-[101] flex h-screen min-h-dvh w-full max-w-md flex-col border-l border-[#D4C9A8] bg-white shadow-xl";

function usePortalOverlayMount() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function usePortalOverlayLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}

type PortalSlideInPanelProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the backdrop dismiss control */
  backdropLabel?: string;
  panelClassName?: string;
};

/**
 * Right-aligned slide-in panel with full-viewport dimmed backdrop (document.body).
 */
export function PortalSlideInPanel({
  open,
  onClose,
  children,
  backdropLabel = "Luk panel",
  panelClassName = "",
}: PortalSlideInPanelProps) {
  const mounted = usePortalOverlayMount();
  usePortalOverlayLock(open, onClose);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={backdropLabel}
        className={PORTAL_OVERLAY_BACKDROP_CLASS}
        onClick={onClose}
      />
      <aside
        className={`${PORTAL_OVERLAY_PANEL_CLASS} ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}

type PortalModalOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Centered dialog vs bottom sheet on small screens */
  position?: "center" | "bottom-sheet";
  className?: string;
};

/**
 * Centered (or bottom-sheet) modal overlay portaled to document.body.
 */
export function PortalModalOverlay({
  open,
  onClose,
  children,
  position = "center",
  className = "",
}: PortalModalOverlayProps) {
  const mounted = usePortalOverlayMount();
  usePortalOverlayLock(open, onClose);

  if (!open || !mounted) return null;

  const alignClass =
    position === "bottom-sheet"
      ? "items-end justify-center p-4 sm:items-center"
      : "items-center justify-center p-4";

  return createPortal(
    <div
      className={`${PORTAL_OVERLAY_BACKDROP_CLASS} flex overflow-y-auto ${alignClass} ${className}`.trim()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      {children}
    </div>,
    document.body,
  );
}
