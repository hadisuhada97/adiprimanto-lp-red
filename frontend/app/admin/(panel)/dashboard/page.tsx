"use client";

import {
  Activity,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Inbox,
  Languages,
  Loader2,
  MessageSquareQuote,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";

type Stats = {
  counts: Record<string, number>;
  leads_timeline: { date: string; total: number }[];
  recent_activity: {
    id: string;
    action: string;
    module: string | null;
    description: string | null;
    user: { name: string } | null;
    created_at: string | null;
  }[];
  recent_messages: {
    id: string;
    name: string;
    subject: string | null;
    status: string;
    created_at: string | null;
  }[];
  translation_gaps: { module: string; missing: number }[];
};

const CARDS = [
  { key: "messages_unread", label: "Unread leads", icon: Inbox, href: "/admin/inbox" },
  { key: "projects_published", label: "Published projects", icon: FileText, href: "/admin/portfolio/projects" },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote, href: "/admin/testimonials" },
  { key: "clients", label: "Clients", icon: Users2, href: "/admin/clients" },
  { key: "media", label: "Media files", icon: ImageIcon, href: "/admin/media" },
] as const;

export default function AdminDashboardPage() {
  const toast = useToast();
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiRequest<Stats>("/admin/dashboard/stats", { auth: true });
        setStats(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Could not load the dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast]);

  const peak = Math.max(1, ...(stats?.leads_timeline.map((point) => point.total) ?? [1]));
  const leadsTotal = stats?.leads_timeline.reduce((sum, point) => sum + point.total, 0) ?? 0;

  return (
    <>
      <PageBreadcrumb title="Dashboard" />

      <div
        className="mb-6 rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
        data-testid="admin-dashboard"
      >
        <h3 className="text-lg font-semibold text-admin-gray-900 dark:text-admin-white/90">
          Welcome back, {user?.name ?? "there"}
        </h3>
        <p className="mt-1 text-sm text-admin-gray-500 dark:text-admin-gray-400">
          {leadsTotal} lead{leadsTotal === 1 ? "" : "s"} in the last 30 days.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20" data-testid="dashboard-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : stats === null ? null : (
        <div className="flex flex-col gap-6" data-testid="dashboard-stats">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                data-testid={`dashboard-card-${card.key}`}
                className="rounded-2xl border border-admin-gray-200 bg-admin-white p-5 transition-colors hover:border-brand-500 dark:border-admin-gray-800 dark:bg-admin-gray-900"
              >
                <card.icon size={18} className="text-brand-500" />
                <p className="mt-3 text-2xl font-semibold text-admin-gray-900 dark:text-admin-white/90">
                  {stats.counts[card.key] ?? 0}
                </p>
                <p className="mt-1 text-xs text-admin-gray-500 dark:text-admin-gray-400">{card.label}</p>
              </Link>
            ))}
          </div>

          <section
            className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
            data-testid="dashboard-leads-chart"
          >
            <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Leads · last 30 days
            </h3>
            <div className="mt-6 flex h-32 items-end gap-1">
              {stats.leads_timeline.map((point) => (
                <span
                  key={point.date}
                  title={`${point.date}: ${point.total}`}
                  className="flex-1 rounded-t bg-brand-500/70 transition-colors hover:bg-brand-500"
                  style={{ height: `${Math.max(4, (point.total / peak) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-admin-gray-400">
              <span>{stats.leads_timeline[0]?.date}</span>
              <span>{stats.leads_timeline[stats.leads_timeline.length - 1]?.date}</span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
              data-testid="dashboard-recent-messages"
            >
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                <Inbox size={16} className="text-brand-500" />
                Latest messages
              </h3>

              {stats.recent_messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  No messages yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.recent_messages.map((message) => (
                    <li key={message.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-admin-gray-800 dark:text-admin-white/90">
                          {message.name}
                        </span>
                        <span className="block truncate text-xs text-admin-gray-500 dark:text-admin-gray-400">
                          {message.subject ?? "No subject"}
                        </span>
                      </span>
                      <StatusBadge tone={message.status === "new" ? "brand" : "neutral"}>
                        {message.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/admin/inbox"
                data-testid="dashboard-inbox-link"
                className="mt-5 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                Open the inbox →
              </Link>
            </section>

            <section
              className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
              data-testid="dashboard-recent-activity"
            >
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                <Activity size={16} className="text-brand-500" />
                Recent activity
              </h3>

              {stats.recent_activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  Nothing logged yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.recent_activity.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <span className="text-admin-gray-800 dark:text-admin-white/90">
                        {entry.user?.name ?? "System"}
                      </span>{" "}
                      <span className="text-admin-gray-500 dark:text-admin-gray-400">
                        {entry.action} {entry.module ?? ""}
                      </span>
                      <span className="block text-[11px] text-admin-gray-400">
                        {entry.created_at === null ? "" : new Date(entry.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/admin/activity-log"
                data-testid="dashboard-activity-link"
                className="mt-5 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                View the full log →
              </Link>
            </section>
          </div>

          <section
            className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
            data-testid="dashboard-translation-gaps"
          >
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              <Languages size={16} className="text-brand-500" />
              Translation coverage
            </h3>

            {stats.translation_gaps.length === 0 ? (
              <p className="text-sm text-success-500">
                Every content item has both Indonesian and English filled in.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.translation_gaps.map((gap) => (
                  <li
                    key={gap.module}
                    className="flex items-center gap-2 text-sm text-admin-gray-700 dark:text-admin-gray-300"
                  >
                    <AlertTriangle size={15} className="text-warning-500" />
                    {gap.module}: {gap.missing} item{gap.missing === 1 ? "" : "s"} without an English translation
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
