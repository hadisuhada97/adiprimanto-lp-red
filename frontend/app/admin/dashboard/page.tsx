"use client";

import {
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";

const MODULES = [
  { key: "projects", label: "Projects", icon: FileText, permission: "projects.view" },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote, permission: "testimonials.view" },
  { key: "media", label: "Media Library", icon: ImageIcon, permission: "media.view" },
  { key: "contact_messages", label: "Inbox", icon: Inbox, permission: "contact_messages.view" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, permissions, status, logout, can } = useAuth();

  useEffect(() => {
    if (status === "guest") router.replace("/admin/login");
  }, [status, router]);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out", "Your session has been ended.");
    router.replace("/admin/login");
  };

  if (status !== "authenticated" || user === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-admin-gray-500"
        data-testid="dashboard-loading"
      >
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-gray-50 dark:bg-admin-gray-950" data-testid="admin-dashboard">
      <header className="border-b border-admin-gray-200 bg-white dark:border-admin-gray-800 dark:bg-admin-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
              AP
            </span>
            <div>
              <p className="text-sm font-semibold text-admin-gray-900 dark:text-white/90">
                Adiprimanto CMS
              </p>
              <p className="flex items-center gap-1.5 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                <LayoutDashboard size={12} /> Dashboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            data-testid="dashboard-logout-button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-admin-gray-300 px-4 text-sm font-medium text-admin-gray-700 transition-colors hover:bg-admin-gray-50 dark:border-admin-gray-700 dark:text-admin-gray-200 dark:hover:bg-admin-gray-800"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold text-admin-gray-900 dark:text-white/90"
            data-testid="dashboard-greeting"
          >
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm text-admin-gray-500 dark:text-admin-gray-400">
            Signed in as{" "}
            <span data-testid="dashboard-user-email" className="font-medium">
              {user.email}
            </span>
            {user.roles?.length ? ` · ${user.roles.map((role) => role.name).join(", ")}` : ""}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ key, label, icon: Icon, permission }) => (
            <div
              key={key}
              data-testid={`dashboard-module-${key}`}
              className="rounded-2xl border border-admin-gray-200 bg-white p-5 dark:border-admin-gray-800 dark:bg-admin-gray-900"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                <Icon size={20} />
              </span>
              <p className="text-sm font-semibold text-admin-gray-900 dark:text-white/90">{label}</p>
              <p className="mt-1 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                {can(permission) ? "Available in the next phase" : "No access"}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-admin-gray-200 bg-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-gray-900 dark:text-white/90">
            <ShieldCheck size={16} className="text-success-500" />
            Session details
          </p>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">
                Two-factor authentication
              </dt>
              <dd className="mt-0.5 font-medium text-admin-gray-800 dark:text-white/90">
                {user.is_two_factor_enabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">Last sign-in</dt>
              <dd className="mt-0.5 font-medium text-admin-gray-800 dark:text-white/90">
                {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-admin-gray-500 dark:text-admin-gray-400">Permissions</dt>
              <dd
                className="mt-0.5 font-medium text-admin-gray-800 dark:text-white/90"
                data-testid="dashboard-permission-count"
              >
                {permissions.length}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
