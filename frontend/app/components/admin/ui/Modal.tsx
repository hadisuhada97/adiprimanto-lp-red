"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  testId: string;
};

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  testId,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-admin-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        data-testid={`${testId}-backdrop`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        className={`relative z-10 w-full ${SIZES[size]} rounded-2xl border border-admin-gray-200 bg-admin-white shadow-[0_24px_64px_-16px_rgba(16,24,40,0.35)] dark:border-admin-gray-800 dark:bg-admin-gray-900`}
        style={{ animation: "admin-toast-in 220ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-admin-gray-200 px-6 py-5 dark:border-admin-gray-800">
          <div>
            <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-admin-gray-500 dark:text-admin-gray-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid={`${testId}-close-button`}
            className="rounded-lg p-1 text-admin-gray-400 transition-colors hover:bg-admin-gray-100 hover:text-admin-gray-700 dark:hover:bg-admin-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-admin-gray-200 px-6 py-4 dark:border-admin-gray-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
