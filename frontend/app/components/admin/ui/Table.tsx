"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function TableCard({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-admin-gray-200 bg-admin-white dark:border-admin-gray-800 dark:bg-admin-gray-900"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
  testId: string;
}) {
  return (
    <div className="px-6 py-16 text-center" data-testid={testId}>
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-admin-gray-100 text-admin-gray-400 dark:bg-admin-gray-800">
        <Icon size={24} />
      </span>
      <p className="mb-1.5 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
        {title}
      </p>
      <p className="mx-auto max-w-sm text-sm text-admin-gray-500 dark:text-admin-gray-400">{message}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800" data-testid="table-skeleton">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 flex-1 animate-pulse rounded bg-admin-gray-100 dark:bg-admin-gray-800"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "success" | "warning" | "neutral" | "brand"; children: ReactNode }) {
  const tones = {
    success: "bg-success-500/10 text-success-500",
    warning: "bg-warning-500/12 text-warning-500",
    brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/12",
    neutral: "bg-admin-gray-100 text-admin-gray-500 dark:bg-admin-gray-800 dark:text-admin-gray-400",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
