"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function PageBreadcrumb({ title, trail = [] }: { title: string; trail?: Crumb[] }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2
        className="text-xl font-semibold text-admin-gray-900 dark:text-admin-white/90"
        data-testid="page-title"
      >
        {title}
      </h2>

      <nav aria-label="Breadcrumb" data-testid="page-breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          <li>
            <Link
              href="/admin/dashboard"
              className="text-admin-gray-500 transition-colors hover:text-brand-500 dark:text-admin-gray-400"
            >
              Home
            </Link>
          </li>
          {trail.map((crumb) => (
            <li key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="text-admin-gray-400" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-admin-gray-500 transition-colors hover:text-brand-500 dark:text-admin-gray-400"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-admin-gray-500 dark:text-admin-gray-400">{crumb.label}</span>
              )}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-admin-gray-400" />
            <span className="font-medium text-admin-gray-800 dark:text-admin-white/90">{title}</span>
          </li>
        </ol>
      </nav>
    </div>
  );
}
