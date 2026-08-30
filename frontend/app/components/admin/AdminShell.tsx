"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/app/lib/admin/auth-context";
import { ROUTE_TITLES } from "@/app/lib/admin/navigation";
import { SidebarProvider, useSidebar } from "@/app/lib/admin/sidebar-context";

function ShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isExpanded, isHovered } = useSidebar();

  const title =
    ROUTE_TITLES[pathname]?.title ??
    Object.keys(ROUTE_TITLES)
      .filter((route) => pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)
      .map((route) => ROUTE_TITLES[route].title)[0] ??
    "Admin Panel";
  const isWide = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-admin-gray-50 dark:bg-admin-gray-950">
      <AdminSidebar />

      <div
        className={`min-h-screen transition-all duration-300 ${isWide ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}
      >
        <AdminHeader title={title} />
        <main className="mx-auto max-w-[1200px] p-4 sm:p-6" data-testid="admin-main">
          {children}
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
