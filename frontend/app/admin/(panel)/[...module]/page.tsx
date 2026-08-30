"use client";

import { CalendarClock, Construction } from "lucide-react";
import Link from "next/link";
import { notFound, usePathname } from "next/navigation";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { PHASE_BY_ROUTE, ROUTE_TITLES } from "@/app/lib/admin/navigation";

const PHASE_LABELS: Record<string, string> = {
  F3: "Phase F3 — Core content modules",
  F4: "Phase F4 — Remaining content modules",
  F5: "Phase F5 — Inbox, audit log, users & roles",
};

export default function AdminModulePlaceholderPage() {
  const pathname = usePathname();
  const route = ROUTE_TITLES[pathname];

  if (route === undefined) notFound();

  const Icon = route.icon;
  const phase = PHASE_BY_ROUTE[pathname];

  return (
    <>
      <PageBreadcrumb title={route.title} trail={[{ label: route.group }]} />

      <div
        className="rounded-2xl border border-admin-gray-200 bg-admin-white p-8 text-center sm:p-14 dark:border-admin-gray-800 dark:bg-admin-gray-900"
        data-testid="module-placeholder"
      >
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
          <Icon size={28} />
        </span>

        <h3 className="mb-2 text-lg font-semibold text-admin-gray-900 dark:text-admin-white/90">
          {route.title}
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-admin-gray-500 dark:text-admin-gray-400">
          The navigation and permissions for this module are ready. The create, edit and delete
          screens land in the next delivery phase.
        </p>

        {phase ? (
          <span
            className="inline-flex items-center gap-2 rounded-full bg-admin-gray-100 px-3 py-1.5 text-xs font-medium text-admin-gray-600 dark:bg-admin-gray-800 dark:text-admin-gray-300"
            data-testid="module-placeholder-phase"
          >
            <CalendarClock size={14} />
            {PHASE_LABELS[phase] ?? phase}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-admin-gray-100 px-3 py-1.5 text-xs font-medium text-admin-gray-600 dark:bg-admin-gray-800 dark:text-admin-gray-300">
            <Construction size={14} />
            Planned
          </span>
        )}

        <div className="mt-8">
          <Link
            href="/admin/dashboard"
            data-testid="module-placeholder-back-link"
            className="text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
