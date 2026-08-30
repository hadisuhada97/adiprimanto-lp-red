"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export default function SortButtons({
  onUp,
  onDown,
  disabledUp,
  disabledDown,
  testIdPrefix,
}: {
  onUp: () => void;
  onDown: () => void;
  disabledUp: boolean;
  disabledDown: boolean;
  testIdPrefix: string;
}) {
  const base =
    "rounded-md p-1 text-admin-gray-500 transition-colors hover:bg-brand-500/10 hover:text-brand-500 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-admin-gray-500 dark:text-admin-gray-300 dark:hover:bg-brand-500/15";

  return (
    <span className="inline-flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onUp}
        disabled={disabledUp}
        aria-label="Move up"
        data-testid={`${testIdPrefix}-move-up`}
        className={base}
      >
        <ChevronUp size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabledDown}
        aria-label="Move down"
        data-testid={`${testIdPrefix}-move-down`}
        className={base}
      >
        <ChevronDown size={16} strokeWidth={2.5} />
      </button>
    </span>
  );
}
