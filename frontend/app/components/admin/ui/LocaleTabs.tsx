"use client";

import { Check } from "lucide-react";
import { LOCALES, type LocaleCode } from "@/app/lib/admin/types";

export default function LocaleTabs({
  active,
  onChange,
  completeness,
  testIdPrefix = "",
}: {
  active: LocaleCode;
  onChange: (locale: LocaleCode) => void;
  completeness: Partial<Record<LocaleCode, boolean>>;
  testIdPrefix?: string;
}) {
  return (
    <div
      role="tablist"
      className="mb-5 flex gap-1 rounded-lg bg-admin-gray-100 p-1 dark:bg-admin-gray-800"
      data-testid={`${testIdPrefix}locale-tabs`}
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          role="tab"
          aria-selected={active === code}
          onClick={() => onChange(code)}
          data-testid={`${testIdPrefix}locale-tab-${code}`}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            active === code
              ? "bg-admin-white text-admin-gray-900 shadow-sm dark:bg-admin-gray-900 dark:text-admin-white/90"
              : "text-admin-gray-500 hover:text-admin-gray-700 dark:text-admin-gray-400"
          }`}
        >
          <span className="uppercase">{code}</span>
          <span className="hidden sm:inline">{label}</span>
          {completeness[code] ? (
            <Check size={14} className="text-success-500" data-testid={`${testIdPrefix}locale-complete-${code}`} />
          ) : (
            <span
              className="h-1.5 w-1.5 rounded-full bg-warning-500"
              data-testid={`${testIdPrefix}locale-incomplete-${code}`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
