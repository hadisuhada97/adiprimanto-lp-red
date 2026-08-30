"use client";

import { Activity, ChevronDown, Loader2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { Select } from "@/app/components/admin/ui/Form";
import { StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";

type LogEntry = {
  id: string;
  action: string;
  module: string | null;
  subject_id: string | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user: { id: string; name: string; email: string } | null;
  created_at: string | null;
};

type Filters = {
  actions: string[];
  modules: { value: string; label: string }[];
};

const TONE: Record<string, "brand" | "success" | "neutral" | "warning"> = {
  created: "success",
  updated: "brand",
  deleted: "warning",
  force_deleted: "warning",
  restored: "neutral",
};

export default function ActivityLogPage() {
  const toast = useToast();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({ actions: [], modules: [] });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ per_page: "50" });
      if (action) query.set("action", action);
      if (module) query.set("subject_type", module);
      if (userId) query.set("user_id", userId);
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      const { data } = await apiRequest<LogEntry[]>(`/admin/activity-logs?${query}`, { auth: true });
      setLogs(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the activity log.");
    } finally {
      setLoading(false);
    }
  }, [action, module, userId, from, to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [filterResponse, userResponse] = await Promise.all([
          apiRequest<Filters>("/admin/activity-logs/filters", { auth: true }),
          apiRequest<{ id: string; name: string }[]>("/admin/users", { auth: true }),
        ]);
        setFilters(filterResponse.data);
        setUsers(userResponse.data.map((user) => ({ id: user.id, name: user.name })));
      } catch {
        // Filter metadata is optional; the table still works without it.
      }
    };

    void loadMeta();
  }, []);

  return (
    <>
      <PageBreadcrumb title="Activity Log" trail={[{ label: "System" }]} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="activity-filters">
        <Select value={action} onChange={(event) => setAction(event.target.value)} data-testid="activity-filter-action">
          <option value="">All actions</option>
          {filters.actions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Select value={module} onChange={(event) => setModule(event.target.value)} data-testid="activity-filter-module">
          <option value="">All modules</option>
          {filters.modules.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <Select value={userId} onChange={(event) => setUserId(event.target.value)} data-testid="activity-filter-user">
          <option value="">All users</option>
          {users.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>

        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label="From date"
          data-testid="activity-filter-from"
          className="rounded-lg border border-admin-gray-300 bg-transparent px-4 py-2.5 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
        />

        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          aria-label="To date"
          data-testid="activity-filter-to"
          className="rounded-lg border border-admin-gray-300 bg-transparent px-4 py-2.5 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
        />
      </div>

      <TableCard testId="activity-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="activity-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20" data-testid="activity-empty-state">
            <Activity size={24} className="text-admin-gray-400" />
            <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
              No activity matches these filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr data-testid={`activity-row-${log.id}`}>
                      <td className="px-6 py-3 text-xs whitespace-nowrap text-admin-gray-500 dark:text-admin-gray-400">
                        {log.created_at === null ? "—" : new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">{log.user?.name ?? "System"}</td>
                      <td className="px-6 py-3">
                        <StatusBadge tone={TONE[log.action] ?? "neutral"}>{log.action}</StatusBadge>
                      </td>
                      <td className="px-6 py-3">{log.module ?? "—"}</td>
                      <td className="max-w-sm px-6 py-3 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                        {log.description ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded((state) => (state === log.id ? null : log.id))}
                          aria-label="Toggle changes"
                          data-testid={`activity-expand-${log.id}`}
                          className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${expanded === log.id ? "rotate-180" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>

                    {expanded === log.id ? (
                      <tr key={`${log.id}-detail`} data-testid={`activity-detail-${log.id}`}>                        <td colSpan={6} className="bg-admin-gray-50 px-6 py-4 dark:bg-admin-gray-800/40">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {(
                              [
                                ["Before", log.old_values],
                                ["After", log.new_values],
                              ] as const
                            ).map(([label, values]) => (
                              <div key={label}>
                                <p className="mb-2 text-xs font-semibold tracking-wide text-admin-gray-500 uppercase dark:text-admin-gray-400">
                                  {label}
                                </p>
                                <pre className="overflow-x-auto rounded-lg bg-admin-white p-3 text-[11px] text-admin-gray-700 dark:bg-admin-gray-900 dark:text-admin-gray-300">
                                  {JSON.stringify(values ?? {}, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                          {log.ip_address === null ? null : (
                            <p className="mt-3 text-[11px] text-admin-gray-400">IP {log.ip_address}</p>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </>
  );
}
