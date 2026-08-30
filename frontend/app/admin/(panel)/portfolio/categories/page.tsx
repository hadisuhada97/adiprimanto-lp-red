"use client";

import { FolderTree, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { LOCALES, slugify, type LocaleCode, type ProjectCategory } from "@/app/lib/admin/types";

type Names = Record<LocaleCode, string>;

const EMPTY_NAMES: Names = { id: "", en: "" };

export default function ProjectCategoriesPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [names, setNames] = useState<Names>(EMPTY_NAMES);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [colorHex, setColorHex] = useState("#465fff");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ProjectCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const { data } = await apiRequest<ProjectCategory[]>(`/admin/project-categories?${query}`, {
        auth: true,
      });
      setItems(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }, [search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setNames(EMPTY_NAMES);
    setSlug("");
    setSlugTouched(false);
    setColorHex("#465fff");
    setIsActive(true);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: ProjectCategory) => {
    setEditingId(item.id);
    setNames({
      id: item.translations.id?.name ?? "",
      en: item.translations.en?.name ?? "",
    });
    setSlug(item.slug);
    setSlugTouched(true);
    setColorHex(item.color_hex ?? "#465fff");
    setIsActive(item.is_active);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    const translations = Object.fromEntries(
      LOCALES.filter(({ code }) => names[code].trim() !== "").map(({ code }) => [
        code,
        { name: names[code].trim() },
      ]),
    );

    try {
      const body = {
        slug: slug || slugify(names.id || names.en),
        color_hex: colorHex || null,
        is_active: isActive,
        translations,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/project-categories/${editingId}`, {
            method: "PATCH",
            auth: true,
            body,
          })
        : await apiRequest("/admin/project-categories", { method: "POST", auth: true, body });

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
        toast.error(error instanceof ApiError ? error.message : "Could not save the category.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ProjectCategory) => {
    try {
      const { message } = await apiRequest(`/admin/project-categories/${item.id}/toggle-active`, {
        method: "PATCH",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the category.");
    }
  };

  const restore = async (item: ProjectCategory) => {
    try {
      const { message } = await apiRequest(`/admin/project-categories/${item.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore the category.");
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/project-categories/${pendingDelete.id}/force`
        : `/admin/project-categories/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the category.");
    } finally {
      setDeleting(false);
    }
  };

  const translationError = errors.translations ?? errors["translations.id.name"] ?? errors["translations.en.name"];

  return (
    <>
      <PageBreadcrumb title="Categories" trail={[{ label: "Content" }, { label: "Portfolio" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            data-testid="category-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="category-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("project_categories.create") ? (
          <Button onClick={openCreate} data-testid="category-create-button">
            <Plus size={16} />
            New category
          </Button>
        ) : null}
      </div>

      <TableCard testId="category-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="category-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={showTrashed ? "Trash is empty" : "No categories yet"}
            message={
              showTrashed
                ? "Deleted categories show up here and can be restored."
                : "Categories replace the guesswork the landing page used to do on the tools string."
            }
            action={
              !showTrashed && can("project_categories.create") ? (
                <Button onClick={openCreate} data-testid="category-empty-create-button">
                  <Plus size={16} />
                  New category
                </Button>
              ) : undefined
            }
            testId="category-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">Name (ID)</th>
                  <th className="px-6 py-3">Name (EN)</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Projects</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item) => (
                  <tr key={item.id} data-testid={`category-row-${item.slug}`}>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full border border-admin-gray-200 dark:border-admin-gray-700"
                          style={{ backgroundColor: item.color_hex ?? "transparent" }}
                        />
                        <span className="font-medium text-admin-gray-800 dark:text-admin-white/90">
                          {item.translations.id?.name ?? "—"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                      {item.translations.en?.name ?? (
                        <StatusBadge tone="warning">Missing</StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {item.slug}
                    </td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                      {item.projects_count ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("project_categories.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() => void toggleActive(item)}
                          label={`Toggle ${item.slug}`}
                          testId={`category-toggle-active-${item.slug}`}
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
                            aria-label={`Restore ${item.slug}`}
                            data-testid={`category-restore-button-${item.slug}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("project_categories.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.slug}`}
                            data-testid={`category-edit-button-${item.slug}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("project_categories.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label={`Delete ${item.slug}`}
                            data-testid={`category-delete-button-${item.slug}`}
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
        title={editingId ? "Edit category" : "New category"}
        onClose={() => setFormOpen(false)}
        size="md"
        testId="category-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} data-testid="category-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="category-form-submit-button">
              {editingId ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          completeness={{ id: names.id.trim() !== "", en: names.en.trim() !== "" }}
        />

        <div className="flex flex-col gap-4">
          <Field
            label={`Name (${locale.toUpperCase()})`}
            required
            error={translationError}
            testId="category-name-field"
          >
            <TextInput
              value={names[locale]}
              hasError={translationError !== undefined}
              onChange={(event) => {
                const value = event.target.value;
                setNames((current) => ({ ...current, [locale]: value }));
                if (!slugTouched && locale === "id") setSlug(slugify(value));
              }}
              placeholder={locale === "id" ? "Next/Nuxt" : "Next/Nuxt"}
              data-testid="category-name-input"
            />
          </Field>

          <Field
            label="Slug"
            required
            error={errors.slug}
            hint="Shared across languages. Lowercase letters, numbers and single hyphens."
            testId="category-slug-field"
          >
            <TextInput
              value={slug}
              hasError={errors.slug !== undefined}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              placeholder="next-nuxt"
              data-testid="category-slug-input"
            />
          </Field>

          <Field label="Colour" error={errors.color_hex} testId="category-color-field">
            <div className="flex gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(event) => setColorHex(event.target.value)}
                aria-label="Pick colour"
                data-testid="category-color-picker"
                className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
              />
              <TextInput
                value={colorHex}
                hasError={errors.color_hex !== undefined}
                onChange={(event) => setColorHex(event.target.value)}
                placeholder="#465fff"
                data-testid="category-color-input"
              />
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active"
              testId="category-form-active-switch"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.name ?? pendingDelete?.slug}” will be removed for good. This cannot be undone.`
            : `“${pendingDelete?.name ?? pendingDelete?.slug}” will be moved to the trash. Projects keep working but lose their category.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="category-delete-dialog"
      />
    </>
  );
}
