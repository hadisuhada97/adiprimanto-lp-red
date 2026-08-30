"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-500 text-admin-white hover:bg-brand-600 disabled:bg-brand-300",
  secondary:
    "border border-admin-gray-300 bg-admin-white text-admin-gray-700 hover:bg-admin-gray-50 dark:border-admin-gray-700 dark:bg-admin-gray-800 dark:text-admin-gray-300 dark:hover:bg-admin-gray-700",
  danger: "bg-error-500 text-admin-white hover:brightness-95 disabled:opacity-60",
  ghost:
    "text-admin-gray-600 hover:bg-admin-gray-100 dark:text-admin-gray-300 dark:hover:bg-admin-gray-800",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
