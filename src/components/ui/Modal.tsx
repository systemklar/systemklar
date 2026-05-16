"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the modal title element for aria-labelledby */
  titleId?: string;
  /** Tailwind classes for the panel (max-width, border color, etc.) */
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
      className="fixed inset-0 z-[100] flex items-stretch justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-[2px] md:items-center md:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex h-full min-h-0 w-full flex-col overflow-y-auto bg-white p-6 shadow-2xl md:h-auto md:max-h-[min(90vh,calc(100dvh-2rem))] md:rounded-2xl md:border md:border-sky-100 md:shadow-sm ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
