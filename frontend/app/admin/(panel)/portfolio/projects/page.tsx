"use client";

import {
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Select, Switch } from "@/app/components/admin/ui/Form";
import { EmptyState, StatusBadge, TableCard, TableSkeleton } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import type { Pagination, Project, ProjectCategory } from "@/app/lib/admin/types";

export default function ProjectsPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [meta, setMeta] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dragIndex = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), per_page: "15" });
      if (search) query.set("search", search);
      if (statusFilter) query.set("status", statusFilter);
      if (categoryFilter) query.set("category_id", categoryFilter);
      if (showTrashed) query.set("trashed", "1");

      const { data, meta: pageMeta } = await apiRequest<Project[]>(`/admin/projects?${query}`, {
        auth: true,
      });

      setItems(data);
      setMeta((pageMeta ?? null) as Pagination | null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiRequest<ProjectCategory[]>("/admin/project-categories", { auth: true })
      .then(({ data }) => setCategories(data))
      .catch(() => undefined);
  }, []);

  const toggleActive = async (project: Project) => {
    try {
      const { message } = await apiRequest(`/admin/projects/${project.id}/toggle-active`, {
        method: "PATCH",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the project.");
    }
  };

  const restore = async (project: Project) => {
    try {
      const { message } = await apiRequest(`/admin/projects/${project.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore the project.");
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/projects/${pendingDelete.id}/force`
        : `/admin/projects/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the project.");
    } finally {
      setDeleting(false);
    }
  };

  const persistOrder = async (ordered: Project[]) => {
    try {
      const { message } = await apiRequest("/admin/projects/reorder", {
        method: "POST",
        auth: true,
        body: { items: ordered.map((project, index) => ({ id: project.id, sort_order: index + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the new order.");
      await load();
    }
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;

    if (from === null || from === targetIndex) return;

    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIndex, 0, moved);

    setItems(reordered);
    void persistOrder(reordered);
  };

  const canReorder = can("projects.update") && !showTrashed && search === "" && statusFilter === "";

  return (
    <>
      <PageBreadcrumb title="Projects" trail={[{ label: "Content" }, { label: "Portfolio" }]} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title or slug"
            data-testid="project-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <div className="w-full sm:w-40">
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            data-testid="project-status-filter"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            data-testid="project-category-filter"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.translations.id?.name ?? category.slug}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => {
            setShowTrashed((current) => !current);
            setPage(1);
          }}
          data-testid="project-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("projects.create") ? (
          <Link href="/admin/portfolio/projects/new" data-testid="project-create-link">
            <Button>
              <Plus size={16} />
              New project
            </Button>
          </Link>
        ) : null}
      </div>

      <TableCard testId="project-table-card">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={showTrashed ? "Trash is empty" : "No projects found"}
            message={
              showTrashed
                ? "Deleted projects show up here and can be restored."
                : "Create your first project or adjust the filters above."
            }
            action={
              !showTrashed && can("projects.create") ? (
                <Link href="/admin/portfolio/projects/new" data-testid="project-empty-create-link">
                  <Button>
                    <Plus size={16} />
                    New project
                  </Button>
                </Link>
              ) : undefined
            }
            testId="project-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Technologies</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((project, index) => (
                  <tr
                    key={project.id}
                    data-testid={`project-row-${project.slug}`}
                    draggable={canReorder}
                    onDragStart={() => {
                      dragIndex.current = index;
                    }}
                    onDragOver={(event) => {
                      if (canReorder) event.preventDefault();
                    }}
                    onDrop={() => handleDrop(index)}
                  >
                    <td className="px-4 py-4">
                      {canReorder ? (
                        <span
                          className="cursor-grab text-admin-gray-300 dark:text-admin-gray-600"
                          data-testid={`project-drag-handle-${project.slug}`}
                        >
                          <GripVertical size={16} />
                        </span>
                      ) : null}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {project.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.cover.url}
                            alt={project.cover.alt_text ?? ""}
                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-admin-gray-100 text-admin-gray-400 dark:bg-admin-gray-800">
                            <FileText size={14} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium text-admin-gray-800 dark:text-admin-white/90">
                            {project.translations.id?.title ?? project.title ?? project.slug}
                            {project.is_featured ? (
                              <Star size={13} className="shrink-0 fill-warning-500 text-warning-500" />
                            ) : null}
                          </p>
                          <p className="truncate font-mono text-[11px] text-admin-gray-400">
                            {project.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {project.category?.name ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: project.category.color_hex ?? "#98a2b3" }}
                          />
                          <span className="text-admin-gray-600 dark:text-admin-gray-300">
                            {project.category.name}
                          </span>
                        </span>
                      ) : (
                        <span className="text-admin-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(project.technologies ?? []).slice(0, 3).map((technology) => (
                          <span
                            key={technology.id}
                            className="rounded-full bg-admin-gray-100 px-2 py-0.5 text-[11px] text-admin-gray-600 dark:bg-admin-gray-800 dark:text-admin-gray-300"
                          >
                            {technology.name}
                          </span>
                        ))}
                        {(project.technologies?.length ?? 0) > 3 ? (
                          <span className="text-[11px] text-admin-gray-400">
                            +{(project.technologies?.length ?? 0) - 3}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : (
                        <StatusBadge tone={project.status === "published" ? "success" : "warning"}>
                          {project.status === "published" ? "Published" : "Draft"}
                        </StatusBadge>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <span className="text-admin-gray-400">—</span>
                      ) : can("projects.update") ? (
                        <Switch
                          checked={project.is_active}
                          onChange={() => void toggleActive(project)}
                          label={`Toggle ${project.slug}`}
                          testId={`project-toggle-active-${project.slug}`}
                        />
                      ) : (
                        <StatusBadge tone={project.is_active ? "success" : "neutral"}>
                          {project.is_active ? "Active" : "Inactive"}
                        </StatusBadge>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {showTrashed ? (
                          <button
                            type="button"
                            onClick={() => void restore(project)}
                            aria-label={`Restore ${project.slug}`}
                            data-testid={`project-restore-button-${project.slug}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("projects.update") ? (
                          <Link
                            href={`/admin/portfolio/projects/${project.id}`}
                            aria-label={`Edit ${project.slug}`}
                            data-testid={`project-edit-link-${project.slug}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </Link>
                        ) : null}

                        {can("projects.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(project)}
                            aria-label={`Delete ${project.slug}`}
                            data-testid={`project-delete-button-${project.slug}`}
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

        {meta && meta.last_page > 1 ? (
          <div
            className="flex items-center justify-between border-t border-admin-gray-200 px-6 py-4 dark:border-admin-gray-800"
            data-testid="project-pagination"
          >
            <span className="text-xs text-admin-gray-500 dark:text-admin-gray-400">
              Page {meta.current_page} of {meta.last_page} · {meta.total} projects
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((current) => current - 1)}
                data-testid="project-previous-page-button"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((current) => current + 1)}
                data-testid="project-next-page-button"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </TableCard>

      {canReorder && items.length > 1 ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-admin-gray-500 dark:text-admin-gray-400">
          <GripVertical size={13} />
          Drag a row by its handle to change the order on the landing page.
        </p>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete project permanently" : "Move project to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.translations.id?.title ?? pendingDelete?.slug}” will be removed for good. This cannot be undone.`
            : `“${pendingDelete?.translations.id?.title ?? pendingDelete?.slug}” will be moved to the trash. You can restore it later.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="project-delete-dialog"
      />
    </>
  );
}
