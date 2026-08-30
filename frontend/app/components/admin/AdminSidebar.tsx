"use client";

import { ChevronDown, MoreHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/admin/auth-context";
import { NAVIGATION, type NavGroup } from "@/app/lib/admin/navigation";
import { useSidebar } from "@/app/lib/admin/sidebar-context";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { can, permissions } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const groups = useMemo<NavGroup[]>(
    () =>
      NAVIGATION.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.permission === undefined || can(item.permission)),
      })).filter((group) => group.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions],
  );

  useEffect(() => {
    const parent = NAVIGATION.flatMap((group) => group.items).find((item) =>
      item.children?.some((child) => pathname.startsWith(child.href)),
    );

    if (parent) {
      setOpenMenus((current) =>
        current.includes(parent.label) ? current : [...current, parent.label],
      );
    }
  }, [pathname]);

  const toggleMenu = (label: string) =>
    setOpenMenus((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-admin-gray-900/50 lg:hidden"
        />
      ) : null}

      <aside
        data-testid="admin-sidebar"
        data-expanded={showLabels}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-admin-gray-200 bg-admin-white transition-all duration-300 dark:border-admin-gray-800 dark:bg-admin-gray-900 ${
          showLabels ? "w-[260px] sm:w-[290px]" : "w-[90px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div
          className={`flex h-[72px] shrink-0 items-center gap-3 border-b border-admin-gray-200 px-5 dark:border-admin-gray-800 ${
            showLabels ? "justify-between" : "justify-center"
          }`}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-3" data-testid="sidebar-logo">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-admin-white">
              AP
            </span>
            {showLabels ? (
              <span className="text-sm font-semibold whitespace-nowrap text-admin-gray-900 dark:text-admin-white/90">
                Adiprimanto CMS
              </span>
            ) : null}
          </Link>

          {isMobileOpen ? (
            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="Close navigation"
              data-testid="sidebar-close-button"
              className="text-admin-gray-500 lg:hidden"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" data-testid="sidebar-nav">
          {groups.map((group) => (
            <div key={group.title} className="mb-6 last:mb-0">
              <p
                className={`mb-3 flex text-xs leading-tight font-medium tracking-wide uppercase text-admin-gray-400 ${
                  showLabels ? "px-2 justify-start" : "justify-center"
                }`}
              >
                {showLabels ? group.title : <MoreHorizontal size={16} />}
              </p>

              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = (item.children?.length ?? 0) > 0;
                  const active = isActive(item.href);
                  const isOpen = openMenus.includes(item.label);

                  return (
                    <li key={item.href}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.label)}
                          data-testid={`sidebar-group-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12"
                              : "text-admin-gray-700 hover:bg-admin-gray-100 dark:text-admin-gray-300 dark:hover:bg-admin-gray-800"
                          } ${showLabels ? "" : "justify-center"}`}
                        >
                          <Icon size={20} className="shrink-0" />
                          {showLabels ? (
                            <>
                              <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                              <ChevronDown
                                size={16}
                                className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              />
                            </>
                          ) : null}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={closeMobileSidebar}
                          data-testid={`sidebar-link-${item.href.replace("/admin/", "").replace(/\//g, "-")}`}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? "bg-brand-50 text-brand-500 dark:bg-brand-500/12"
                              : "text-admin-gray-700 hover:bg-admin-gray-100 dark:text-admin-gray-300 dark:hover:bg-admin-gray-800"
                          } ${showLabels ? "" : "justify-center"}`}
                        >
                          <Icon size={20} className="shrink-0" />
                          {showLabels ? (
                            <span className="flex-1 whitespace-nowrap">{item.label}</span>
                          ) : null}
                        </Link>
                      )}

                      {hasChildren && showLabels && isOpen ? (
                        <ul className="mt-1 ml-[34px] flex flex-col gap-1 border-l border-admin-gray-200 pl-3 dark:border-admin-gray-800">
                          {item.children!
                            .filter((child) => child.permission === undefined || can(child.permission))
                            .map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  onClick={closeMobileSidebar}
                                  data-testid={`sidebar-link-${child.href.replace("/admin/", "").replace(/\//g, "-")}`}
                                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                    pathname === child.href
                                      ? "bg-brand-50 font-medium text-brand-500 dark:bg-brand-500/12"
                                      : "text-admin-gray-600 hover:bg-admin-gray-100 dark:text-admin-gray-400 dark:hover:bg-admin-gray-800"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
