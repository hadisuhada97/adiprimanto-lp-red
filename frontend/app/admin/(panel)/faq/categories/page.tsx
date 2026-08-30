"use client";

import { FolderTree, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { LOCALES, slugify, type FaqCategory, type LocaleCode } from "@/app/lib/admin/types";

type Names = Record<LocaleCode, string>;

export default function FaqCategoriesPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrashed, setShowTrashed] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [names, setNames] = useState<Names>({ id: "", en: "" });
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<FaqCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = showTrashed ? "?trashed=1" : "";
      const { data } = await apiRequest<FaqCategory[]>(`/admin/faq-categories${query}`, { auth: true });
      setItems(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load FAQ categories.");
    } finally {
      setLoading(false);
    }
  }, [showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setNames({ id: "", en: "" });
    setSlug("");
    setSlugTouched(false);
    setIsActive(true);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: FaqCategory) => {
    setEditingId(item.id);
    setNames({ id: item.translations.id?.name ?? "", en: item.translations.en?.name ?? "" });
    setSlug(item.slug);
    setSlugTouched(true);
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
        is_active: isActive,
        translations,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/faq-categories/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/faq-categories", { method: "POST", auth: true, body });

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

  const act = async (path: string, method: "PATCH" | "POST", fallback: string) => {
    try {
      const { message } = await apiRequest(path, { method, auth: true });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : fallback);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    try {
      const { message } = await apiRequest("/admin/faq-categories/reorder", {
        method: "POST",
        auth: true,
        body: { items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder the categories.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/faq-categories/${pendingDelete.id}/force`
        : `/admin/faq-categories/${pendingDelete.id}`;
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

  return (
    <>
      <PageBreadcrumb title="FAQ · Categories" trail={[{ label: "Content" }, { label: "FAQ" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex-1" />

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="faq-category-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("faqs.create") ? (
          <Button onClick={openCreate} data-testid="faq-category-create-button">
            <Plus size={16} />
            New category
          </Button>
        ) : null}
      </div>

      <TableCard testId="faq-category-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="faq-category-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={showTrashed ? "Trash is empty" : "No categories yet"}
            message="Group your questions so visitors find answers faster."
            action={
              !showTrashed && can("faqs.create") ? (
                <Button onClick={openCreate} data-testid="faq-category-empty-create-button">
                  <Plus size={16} />
                  New category
                </Button>
              ) : undefined
            }
            testId="faq-category-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Questions</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item, index) => (
                  <tr key={item.id} data-testid={`faq-category-row-${item.slug}`}>
                    <td className="px-3 py-4">
                      {!showTrashed && can("faqs.update") ? (
                        <SortButtons
                          onUp={() => void move(index, -1)}
                          onDown={() => void move(index, 1)}
                          disabledUp={index === 0}
                          disabledDown={index === items.length - 1}
                          testIdPrefix={`faq-category-${item.slug}`}
                        />
                      ) : null}
                    </td>
                    <td className="px-6 py-4 font-medium text-admin-gray-800 dark:text-admin-white/90">
                      {item.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {item.slug}
                    </td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                      {item.faqs_count ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("faqs.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() =>
                            void act(`/admin/faq-categories/${item.id}/toggle-active`, "PATCH", "Could not update.")
                          }
                          label={`Toggle ${item.name ?? item.slug}`}
                          testId={`faq-category-toggle-active-${item.slug}`}
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
                            onClick={() =>
                              void act(`/admin/faq-categories/${item.id}/restore`, "POST", "Could not restore.")
                            }
                            aria-label="Restore category"
                            data-testid={`faq-category-restore-button-${item.slug}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("faqs.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label="Edit category"
                            data-testid={`faq-category-edit-button-${item.slug}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("faqs.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label="Delete category"
                            data-testid={`faq-category-delete-button-${item.slug}`}
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
        description="The slug is used by the public API and never shown to visitors."
        onClose={() => setFormOpen(false)}
        size="md"
        testId="faq-category-form-modal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFormOpen(false)}
              data-testid="faq-category-form-cancel-button"
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="faq-category-form-submit-button">
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
            label="Name"
            required
            error={errors[`translations.${locale}.name`] ?? errors.translations}
            testId="faq-category-name-field"
          >
            <TextInput
              value={names[locale]}
              onChange={(event) => {
                const value = event.target.value;
                setNames((current) => ({ ...current, [locale]: value }));
                if (!slugTouched && locale === "id") setSlug(slugify(value));
              }}
              placeholder="Umum"
              data-testid="faq-category-name-input"
            />
          </Field>

          <Field label="Slug" required error={errors.slug} testId="faq-category-slug-field">
            <TextInput
              value={slug}
              hasError={errors.slug !== undefined}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              placeholder="general"
              data-testid="faq-category-slug-input"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active"
              testId="faq-category-form-active-switch"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.name}” will be removed for good.`
            : `“${pendingDelete?.name}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="faq-category-delete-dialog"
      />
    </>
  );
}
