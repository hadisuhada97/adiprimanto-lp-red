"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/app/lib/admin/auth-context";
import { ROUTE_PERMISSIONS, ROUTE_TITLES } from "@/app/lib/admin/navigation";
import { SidebarProvider, useSidebar } from "@/app/lib/admin/sidebar-context";
import { ShieldAlert } from "lucide-react";

function ShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isExpanded, isHovered } = useSidebar();
  const { can } = useAuth();

  const title =
    ROUTE_TITLES[pathname]?.title ??
    Object.keys(ROUTE_TITLES)
      .filter((route) => pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)
      .map((route) => ROUTE_TITLES[route].title)[0] ??
    "Admin Panel";
  const isWide = isExpanded || isHovered;

  const required =
    ROUTE_PERMISSIONS[pathname] ??
    Object.keys(ROUTE_PERMISSIONS)
      .filter((route) => pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)
      .map((route) => ROUTE_PERMISSIONS[route])[0];
  const allowed = required === undefined || can(required);

  return (
    <div className="min-h-screen bg-admin-gray-50 dark:bg-admin-gray-950">
      <AdminSidebar />

      <div
        className={`min-h-screen transition-all duration-300 ${isWide ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}
      >
        <AdminHeader title={title} />
        <main className="mx-auto max-w-[1200px] p-4 sm:p-6" data-testid="admin-main">
          {allowed ? (
            children
          ) : (
            <div
              className="mx-auto max-w-md rounded-2xl border border-admin-gray-200 bg-admin-white px-8 py-14 text-center dark:border-admin-gray-800 dark:bg-admin-gray-900"
              data-testid="admin-access-denied"
            >
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-500/10 text-error-500">
                <ShieldAlert size={22} />
              </span>
              <h2 className="mb-1 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                Access denied
              </h2>
              <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
                Your role does not include the “{required}” permission. Ask a Super Admin if you
                need access to this page.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "guest") router.replace("/admin/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-admin-gray-500"
        data-testid="admin-shell-loading"
      >
        Loading your dashboard…
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ShellBody>{children}</ShellBody>
    </SidebarProvider>
  );
}
