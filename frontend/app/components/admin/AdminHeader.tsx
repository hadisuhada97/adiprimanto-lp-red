"use client";

import { ChevronDown, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useSidebar } from "@/app/lib/admin/sidebar-context";
import { useToast } from "@/app/lib/admin/toast";
import { useTheme } from "@/app/lib/theme-context";

export default function AdminHeader({ title }: { title: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isExpanded, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.name ?? "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out", "Your session has been ended.");
    router.replace("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-admin-gray-200 bg-admin-white px-4 sm:px-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
      <button
        type="button"
        onClick={toggleMobileSidebar}
        aria-label="Open navigation"
        data-testid="header-mobile-menu-button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-admin-gray-200 text-admin-gray-500 transition-colors hover:bg-admin-gray-50 lg:hidden dark:border-admin-gray-800 dark:hover:bg-admin-gray-800"
      >
        <Menu size={20} />
      </button>

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        data-testid="header-sidebar-toggle-button"
        className="hidden h-10 w-10 items-center justify-center rounded-lg border border-admin-gray-200 text-admin-gray-500 transition-colors hover:bg-admin-gray-50 lg:flex dark:border-admin-gray-800 dark:hover:bg-admin-gray-800"
      >
        {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </button>

      <h1
        className="flex-1 truncate text-base font-semibold text-admin-gray-900 sm:text-lg dark:text-admin-white/90"
        data-testid="header-page-title"
      >
        {title}
      </h1>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        data-testid="header-theme-toggle-button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-admin-gray-200 text-admin-gray-500 transition-colors hover:bg-admin-gray-50 dark:border-admin-gray-800 dark:hover:bg-admin-gray-800"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          data-testid="header-user-menu-button"
          className="flex items-center gap-2.5 rounded-lg border border-admin-gray-200 py-1.5 pr-3 pl-1.5 transition-colors hover:bg-admin-gray-50 dark:border-admin-gray-800 dark:hover:bg-admin-gray-800"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-admin-white">
            {initials || <UserRound size={14} />}
          </span>
          <span className="hidden text-sm font-medium text-admin-gray-700 sm:block dark:text-admin-gray-200">
            {user?.name}
          </span>
          <ChevronDown
            size={16}
            className={`text-admin-gray-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isMenuOpen ? (
          <div
            data-testid="header-user-menu"
            className="absolute right-0 mt-2 w-64 rounded-xl border border-admin-gray-200 bg-admin-white p-2 shadow-[0_12px_34px_-10px_rgba(16,24,40,0.25)] dark:border-admin-gray-800 dark:bg-admin-gray-800"
          >
            <div className="border-b border-admin-gray-200 px-3 pb-3 dark:border-admin-gray-700">
              <p className="truncate text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
                {user?.name}
              </p>
              <p className="truncate text-xs text-admin-gray-500 dark:text-admin-gray-400">
                {user?.email}
              </p>
              {user?.roles?.length ? (
                <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-500 dark:bg-brand-500/12">
                  {user.roles.map((role) => role.name).join(", ")}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              data-testid="header-logout-button"
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-admin-gray-700 transition-colors hover:bg-admin-gray-100 dark:text-admin-gray-200 dark:hover:bg-admin-gray-700"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
