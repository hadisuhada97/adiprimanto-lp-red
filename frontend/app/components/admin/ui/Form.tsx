"use client";

import type { ReactNode } from "react";

const BASE =
  "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-admin-gray-800 outline-none transition-colors placeholder:text-admin-gray-400 focus:border-brand-500 dark:text-admin-white/90";

function borderClass(hasError: boolean): string {
  return hasError
    ? "border-error-500"
    : "border-admin-gray-300 dark:border-admin-gray-700";
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  testId,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <label className="block" data-testid={testId}>
      <span className="mb-1.5 block text-sm font-medium text-admin-gray-700 dark:text-admin-gray-300">
        {label}
        {required ? <span className="ml-0.5 text-error-500">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-error-500" data-testid={testId ? `${testId}-error` : undefined}>
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-admin-gray-500 dark:text-admin-gray-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  hasError = false,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return <input {...rest} className={`${BASE} ${borderClass(hasError)} ${className}`} />;
}

export function TextArea({
  hasError = false,
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return <textarea {...rest} className={`${BASE} ${borderClass(hasError)} ${className}`} />;
}

export function Select({
  hasError = false,
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      {...rest}
      className={`${BASE} ${borderClass(hasError)} dark:bg-admin-gray-900 ${className}`}
    >
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? "Toggle"}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-brand-500" : "bg-admin-gray-300 dark:bg-admin-gray-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-admin-white transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}
