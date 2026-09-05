"use client";

import { Loader2, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";

type TrashItem = {
  id: string;
  module: string;
  module_label: string;
  title: string;
  deleted_at: string | null;
  can_restore: boolean;
  can_force_delete: boolean;
};

type TrashModule = { module: string; label: string; count: number };

export default function TrashPage() {
  const toast = useToast();

  const [items, setItems] = useState<TrashItem[]>([]);
  const [modules, setModules] = useState<TrashModule[]>([]);
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingPurge, setPendingPurge] = useState<TrashItem | null>(null);
  const [purging, setPurging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = module ? `?module=${module}` : "";
      const { data } = await apiRequest<{ items: TrashItem[]; modules: TrashModule[] }>(
        `/admin/trash${query}`,
        { auth: true },
      );

      setItems(data.items);
      setModules(data.modules);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the trash.");
    } finally {
      setLoading(false);
    }
  }, [module, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(() => modules.reduce((sum, item) => sum + item.count, 0), [modules]);
  const filled = useMemo(() => modules.filter((item) => item.count > 0), [modules]);

  const restore = async (item: TrashItem) => {
    try {
      const { message } = await apiRequest(`/admin/trash/${item.module}/${item.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore this item.");
    }
  };

  const purge = async () => {
    if (pendingPurge === null) return;

    setPurging(true);
    try {
      const { message } = await apiRequest(
        `/admin/trash/${pendingPurge.module}/${pendingPurge.id}/force`,
        { method: "DELETE", auth: true },
      );
      toast.success(message);
      setPendingPurge(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete this item.");
    } finally {
      setPurging(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Trash" trail={[{ label: "System" }]} />

      <div className="mb-5 flex flex-wrap items-center gap-2" data-testid="trash-module-filters">
        <button
          type="button"
          onClick={() => setModule("")}
          data-testid="trash-filter-all"
          className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
            module === ""
              ? "bg-brand-500 text-admin-white"
              : "bg-admin-gray-100 text-admin-gray-600 hover:bg-admin-gray-200 dark:bg-admin-gray-800 dark:text-admin-gray-300"
          }`}
        >
          All modules · {total}
        </button>

        {filled.map((item) => (
          <button
            key={item.module}
            type="button"
            onClick={() => setModule(item.module)}
            data-testid={`trash-filter-${item.module}`}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              module === item.module
                ? "bg-brand-500 text-admin-white"
                : "bg-admin-gray-100 text-admin-gray-600 hover:bg-admin-gray-200 dark:bg-admin-gray-800 dark:text-admin-gray-300"
            }`}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <TableCard testId="trash-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="trash-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Nothing in the trash"
            message="Deleted content from every module lands here and can be restored or removed for good."
            testId="trash-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Deleted</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item) => (
                  <tr key={`${item.module}-${item.id}`} data-testid={`trash-row-${item.id}`}>
                    <td className="max-w-sm px-6 py-3">
                      <span className="line-clamp-1 font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {item.title}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge tone="neutral">{item.module_label}</StatusBadge>
                    </td>
                    <td className="px-6 py-3 text-xs whitespace-nowrap text-admin-gray-500 dark:text-admin-gray-400">
                      {item.deleted_at === null ? "—" : new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {item.can_restore ? (
                          <button
                            type="button"
                            onClick={() => void restore(item)}
                            aria-label="Restore item"
                            data-testid={`trash-restore-button-${item.id}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <Undo2 size={15} />
                          </button>
                        ) : null}

                        {item.can_force_delete ? (
                          <button
                            type="button"
                            onClick={() => setPendingPurge(item)}
                            aria-label="Delete permanently"
                            data-testid={`trash-force-delete-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-error-500/10 hover:text-error-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={() => void load()} data-testid="trash-refresh-button">
          <RotateCcw size={16} />
          Refresh
        </Button>
      </div>

      <ConfirmDialog
        open={pendingPurge !== null}
        title="Delete permanently"
        message={`“${pendingPurge?.title ?? ""}” will be removed for good. This cannot be undone.`}
        confirmLabel="Delete permanently"
        loading={purging}
        onConfirm={() => void purge()}
        onCancel={() => setPendingPurge(null)}
        testId="trash-force-delete-dialog"
      />
    </>
  );
}
