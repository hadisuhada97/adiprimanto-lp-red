import type { Metadata } from "next";
import { AuthProvider } from "@/app/lib/admin/auth-context";
import { ToastProvider } from "@/app/lib/admin/toast";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Content management system for adiprimanto.com",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root font-admin relative z-1 min-h-screen bg-admin-white text-admin-gray-800 dark:bg-admin-gray-900 dark:text-admin-white/90">
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </div>
  );
}
