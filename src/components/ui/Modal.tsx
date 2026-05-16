"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the modal title element for aria-labelledby */
  titleId?: string;
  /** Tailwind max-width class, e.g. max-w-md */
  panelClassName?: string;
};

/**
 * Centered overlay mounted on document.body (avoids broken `fixed` inside
 * transformed ancestors such as `.page-transition-shell`).
 */
export function Modal({
  open,
  onClose,
  children,
  titleId,
  panelClassName = "max-w-md",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px] sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${panelClassName} max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
