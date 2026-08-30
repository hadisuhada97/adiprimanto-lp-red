"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type ToastContextValue = {
  showToast: (variant: ToastVariant, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANTS: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: "border-success-500/30", iconColor: "text-success-500" },
  error: { icon: XCircle, ring: "border-error-500/30", iconColor: "text-error-500" },
  warning: { icon: AlertTriangle, ring: "border-warning-500/30", iconColor: "text-warning-500" },
  info: { icon: Info, ring: "border-brand-500/30", iconColor: "text-brand-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((current) => [...current, { id, variant, title, description }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (title: string, description?: string) => showToast("success", title, description),
      error: (title: string, description?: string) => showToast("error", title, description),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3"
        data-testid="toast-container"
      >
        {toasts.map((toast) => {
          const { icon: Icon, ring, iconColor } = VARIANTS[toast.variant];

          return (
            <div
              key={toast.id}
              role="status"
              data-testid={`toast-${toast.variant}`}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${ring} bg-white p-4 shadow-[0_12px_34px_-10px_rgba(16,24,40,0.25)] dark:bg-admin-gray-800`}
              style={{ animation: "admin-toast-in 260ms cubic-bezier(0.16,1,0.3,1)" }}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-admin-gray-800 dark:text-white/90">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-0.5 text-sm leading-normal text-admin-gray-500 dark:text-admin-gray-400">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                data-testid="toast-dismiss-button"
                className="text-admin-gray-400 transition-colors hover:text-admin-gray-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
