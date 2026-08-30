"use client";

import {
  Activity,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Inbox,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { useAuth } from "@/app/lib/admin/auth-context";
import { NAVIGATION } from "@/app/lib/admin/navigation";

const QUICK_LINKS = [
  { label: "Projects", href: "/admin/portfolio/projects", icon: FileText, permission: "projects.view" },
  { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, permission: "testimonials.view" },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon, permission: "media.view" },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox, permission: "contact_messages.view" },
];

export default function AdminDashboardPage() {
  const { user, permissions, can } = useAuth();

  const reachableModules = NAVIGATION.flatMap((group) => group.items).filter(
    (item) => item.permission === undefined || can(item.permission),
  ).length;

  return (
    <>
      <PageBreadcrumb title="Dashboard" />

      <div
        className="mb-6 rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
        data-testid="admin-dashboard"
      >
        <h3
          className="text-lg font-semibold text-admin-gray-900 dark:text-admin-white/90"
          data-testid="dashboard-greeting"
        >
          Welcome back, {user?.name}
        </h3>
        <p className="mt-1 text-sm text-admin-gray-500 dark:text-admin-gray-400">
          Signed in as{" "}
          <span className="font-medium" data-testid="dashboard-user-email">
            {user?.email}
          </span>
          {user?.roles?.length ? ` · ${user.roles.map((role) => role.name).join(", ")}` : ""}
        </p>
      </div>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.filter((link) => can(link.permission)).map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            data-testid={`dashboard-quick-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className="group rounded-2xl border border-admin-gray-200 bg-admin-white p-5 transition-colors hover:border-brand-500 dark:border-admin-gray-800 dark:bg-admin-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                <Icon size={20} />
              </span>
              <ArrowUpRight
                size={16}
                className="text-admin-gray-400 transition-colors group-hover:text-brand-500"
              />
            </div>
            <p className="text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">{label}</p>
            <p className="mt-1 text-xs text-admin-gray-500 dark:text-admin-gray-400">
              Open module
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
            <ShieldCheck size={16} className="text-success-500" />
            Session details
          </p>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">
                Two-factor authentication
              </dt>
              <dd className="mt-0.5 font-medium text-admin-gray-800 dark:text-admin-white/90">
                {user?.is_two_factor_enabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">Last sign-in</dt>
              <dd className="mt-0.5 font-medium text-admin-gray-800 dark:text-admin-white/90">
                {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">Permissions</dt>
              <dd
                className="mt-0.5 font-medium text-admin-gray-800 dark:text-admin-white/90"
                data-testid="dashboard-permission-count"
              >
                {permissions.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">
                Modules you can reach
              </dt>
              <dd
                className="mt-0.5 font-medium text-admin-gray-800 dark:text-admin-white/90"
                data-testid="dashboard-module-count"
              >
                {reachableModules}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
            <Activity size={16} className="text-brand-500" />
            Delivery roadmap
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              ["F1 — Foundation", "Done"],
              ["F2 — Authentication & 2FA", "Done"],
              ["F3 — Core content modules", "Next"],
              ["F4 — Remaining content modules", "Planned"],
              ["F5 — Inbox, audit log, users", "Planned"],
            ].map(([label, state]) => (
              <li key={label} className="flex items-center justify-between gap-3">
                <span className="text-admin-gray-700 dark:text-admin-gray-300">{label}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    state === "Done"
                      ? "bg-success-500/10 text-success-500"
                      : state === "Next"
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12"
                        : "bg-admin-gray-100 text-admin-gray-500 dark:bg-admin-gray-800 dark:text-admin-gray-400"
                  }`}
                >
                  {state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
