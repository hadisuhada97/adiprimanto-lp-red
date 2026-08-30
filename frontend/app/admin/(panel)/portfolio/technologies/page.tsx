"use client";

import { Loader2, Pencil, Plus, RotateCcw, Search, Trash2, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextInput } from "@/app/components/admin/ui/Form";
import Modal from "@/app/components/admin/ui/Modal";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { slugify, type Technology } from "@/app/lib/admin/types";

type FormState = {
  name: string;
  slug: string;
  icon_name: string;
  color_hex: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  icon_name: "",
  color_hex: "#465fff",
  is_active: true,
};

export default function TechnologiesPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Technology | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const { data } = await apiRequest<Technology[]>(`/admin/technologies?${query}`, { auth: true });
      setItems(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load technologies.");
    } finally {
      setLoading(false);
    }
  }, [search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEdit = (item: Technology) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      icon_name: item.icon_name ?? "",
      color_hex: item.color_hex ?? "#465fff",
      is_active: item.is_active,
    });
    setErrors({});
    setSlugTouched(true);
    setFormOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    try {
      const body = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        icon_name: form.icon_name || null,
        color_hex: form.color_hex || null,
        is_active: form.is_active,
      };

      const { message } = editingId
        ? await apiRequest<Technology>(`/admin/technologies/${editingId}`, {
            method: "PATCH",
            auth: true,
            body,
          })
        : await apiRequest<Technology>("/admin/technologies", { method: "POST", auth: true, body });

      toast.success(message);
      setFormOpen(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the technology.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Technology) => {
    try {
      const { message } = await apiRequest(`/admin/technologies/${item.id}/toggle-active`, {
        method: "PATCH",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the technology.");
    }
  };

  const restore = async (item: Technology) => {
    try {
      const { message } = await apiRequest(`/admin/technologies/${item.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore the technology.");
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/technologies/${pendingDelete.id}/force`
        : `/admin/technologies/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the technology.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Technologies" trail={[{ label: "Content" }, { label: "Portfolio" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search technologies"
            data-testid="technology-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="technology-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("technologies.create") ? (
          <Button onClick={openCreate} data-testid="technology-create-button">
            <Plus size={16} />
            New technology
          </Button>
        ) : null}
      </div>

      <TableCard testId="technology-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="technology-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={showTrashed ? "Trash is empty" : "No technologies yet"}
            message={
              showTrashed
                ? "Deleted technologies show up here and can be restored."
                : "Technologies replace the comma-separated tool strings used by the old landing page."
            }
            action={
              !showTrashed && can("technologies.create") ? (
                <Button onClick={openCreate} data-testid="technology-empty-create-button">
                  <Plus size={16} />
                  New technology
                </Button>
              ) : undefined
            }
            testId="technology-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Icon</th>
                  <th className="px-6 py-3">Projects</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item) => (
                  <tr key={item.id} data-testid={`technology-row-${item.slug}`}>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full border border-admin-gray-200 dark:border-admin-gray-700"
                          style={{ backgroundColor: item.color_hex ?? "transparent" }}
                        />
                        <span className="font-medium text-admin-gray-800 dark:text-admin-white/90">
                          {item.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {item.slug}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {item.icon_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                      {item.projects_count ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("technologies.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() => void toggleActive(item)}
                          label={`Toggle ${item.name}`}
                          testId={`technology-toggle-active-${item.slug}`}
                        />
                      ) : (
                        <StatusBadge tone={item.is_active ? "success" : "neutral"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {showTrashed ? (
                          <button
                            type="button"
                            onClick={() => void restore(item)}
                            aria-label={`Restore ${item.name}`}
                            data-testid={`technology-restore-button-${item.slug}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("technologies.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            data-testid={`technology-edit-button-${item.slug}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("technologies.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label={`Delete ${item.name}`}
                            data-testid={`technology-delete-button-${item.slug}`}
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

      <Modal
        open={formOpen}
        title={editingId ? "Edit technology" : "New technology"}
        description="Technology names are technical labels and are not translated."
        onClose={() => setFormOpen(false)}
        size="md"
        testId="technology-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} data-testid="technology-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="technology-form-submit-button">
              {editingId ? "Save changes" : "Create technology"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name" required error={errors.name} testId="technology-name-field">
            <TextInput
              value={form.name}
              hasError={errors.name !== undefined}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : slugify(name),
                }));
              }}
              placeholder="Next.js"
              data-testid="technology-name-input"
            />
          </Field>

          <Field
            label="Slug"
            required
            error={errors.slug}
            hint="Lowercase letters, numbers and single hyphens."
            testId="technology-slug-field"
          >
            <TextInput
              value={form.slug}
              hasError={errors.slug !== undefined}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((current) => ({ ...current, slug: event.target.value }));
              }}
              placeholder="nextjs"
              data-testid="technology-slug-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Icon name"
              error={errors.icon_name}
              hint="react-icons identifier, for example SiNextdotjs."
              testId="technology-icon-field"
            >
              <TextInput
                value={form.icon_name}
                hasError={errors.icon_name !== undefined}
                onChange={(event) => setForm((current) => ({ ...current, icon_name: event.target.value }))}
                placeholder="SiNextdotjs"
                data-testid="technology-icon-input"
              />
            </Field>

            <Field label="Colour" error={errors.color_hex} testId="technology-color-field">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.color_hex}
                  onChange={(event) => setForm((current) => ({ ...current, color_hex: event.target.value }))}
                  aria-label="Pick colour"
                  data-testid="technology-color-picker"
                  className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
                />
                <TextInput
                  value={form.color_hex}
                  hasError={errors.color_hex !== undefined}
                  onChange={(event) => setForm((current) => ({ ...current, color_hex: event.target.value }))}
                  placeholder="#465fff"
                  data-testid="technology-color-input"
                />
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={form.is_active}
              onChange={(next) => setForm((current) => ({ ...current, is_active: next }))}
              label="Active"
              testId="technology-form-active-switch"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.name}” will be removed for good. This cannot be undone.`
            : `“${pendingDelete?.name}” will be moved to the trash. You can restore it later.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="technology-delete-dialog"
      />
    </>
  );
}
