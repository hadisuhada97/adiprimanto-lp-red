"use client";

import { Loader2, MessageCircleQuestion, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Select, Switch, TextArea, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { LOCALES, type Faq, type FaqCategory, type LocaleCode } from "@/app/lib/admin/types";

type TranslationState = Record<LocaleCode, { question: string; answer: string }>;

const EMPTY: TranslationState = {
  id: { question: "", answer: "" },
  en: { question: "", answer: "" },
};

export default function FaqQuestionsPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [translations, setTranslations] = useState<TranslationState>(EMPTY);
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (categoryFilter) query.set("category_id", categoryFilter);
      if (showTrashed) query.set("trashed", "1");

      const [faqResponse, categoryResponse] = await Promise.all([
        apiRequest<Faq[]>(`/admin/faqs?${query}`, { auth: true }),
        apiRequest<FaqCategory[]>("/admin/faq-categories", { auth: true }),
      ]);

      setItems(faqResponse.data);
      setCategories(categoryResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the FAQ list.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setTranslations({ id: { question: "", answer: "" }, en: { question: "", answer: "" } });
    setCategoryId("");
    setIsFeatured(false);
    setIsActive(true);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Faq) => {
    setEditingId(item.id);
    setTranslations({
      id: {
        question: item.translations.id?.question ?? "",
        answer: item.translations.id?.answer ?? "",
      },
      en: {
        question: item.translations.en?.question ?? "",
        answer: item.translations.en?.answer ?? "",
      },
    });
    setCategoryId(item.faq_category_id ?? "");
    setIsFeatured(item.is_featured);
    setIsActive(item.is_active);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    const payload = Object.fromEntries(
      LOCALES.filter(({ code }) => translations[code].question.trim() !== "").map(({ code }) => [
        code,
        {
          question: translations[code].question.trim(),
          answer: translations[code].answer.trim(),
        },
      ]),
    );

    try {
      const body = {
        faq_category_id: categoryId || null,
        is_featured: isFeatured,
        is_active: isActive,
        translations: payload,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/faqs/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/faqs", { method: "POST", auth: true, body });

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
        toast.error(error instanceof ApiError ? error.message : "Could not save the FAQ.");
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
      const { message } = await apiRequest("/admin/faqs/reorder", {
        method: "POST",
        auth: true,
        body: { items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder the FAQ list.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed ? `/admin/faqs/${pendingDelete.id}/force` : `/admin/faqs/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the FAQ.");
    } finally {
      setDeleting(false);
    }
  };

  const active = translations[locale];

  return (
    <>
      <PageBreadcrumb title="FAQ · Questions" trail={[{ label: "Content" }, { label: "FAQ" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions and answers"
            data-testid="faq-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
          data-testid="faq-category-filter"
          className="rounded-lg border border-admin-gray-300 bg-transparent px-4 py-2.5 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:bg-admin-gray-900 dark:text-admin-white/90"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="faq-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("faqs.create") ? (
          <Button onClick={openCreate} data-testid="faq-create-button">
            <Plus size={16} />
            New question
          </Button>
        ) : null}
      </div>

      <TableCard testId="faq-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="faq-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageCircleQuestion}
            title={showTrashed ? "Trash is empty" : "No questions yet"}
            message="Answer the questions clients keep asking before they contact you."
            action={
              !showTrashed && can("faqs.create") ? (
                <Button onClick={openCreate} data-testid="faq-empty-create-button">
                  <Plus size={16} />
                  New question
                </Button>
              ) : undefined
            }
            testId="faq-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-6 py-3">Question</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item, index) => (
                  <tr key={item.id} data-testid={`faq-row-${item.id}`}>
                    <td className="px-3 py-4">
                      {!showTrashed && can("faqs.update") ? (
                        <SortButtons
                          onUp={() => void move(index, -1)}
                          onDown={() => void move(index, 1)}
                          disabledUp={index === 0}
                          disabledDown={index === items.length - 1}
                          testIdPrefix={`faq-${item.id}`}
                        />
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {item.question ?? "—"}
                      </span>
                      <span className="mt-0.5 block max-w-xl truncate text-xs text-admin-gray-500 dark:text-admin-gray-400">
                        {item.answer ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.category ? (
                        <StatusBadge tone="brand">{item.category.name}</StatusBadge>
                      ) : (
                        <span className="text-admin-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("faqs.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() => void act(`/admin/faqs/${item.id}/toggle-active`, "PATCH", "Could not update.")}
                          label="Toggle question"
                          testId={`faq-toggle-active-${item.id}`}
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
                            onClick={() => void act(`/admin/faqs/${item.id}/restore`, "POST", "Could not restore.")}
                            aria-label="Restore question"
                            data-testid={`faq-restore-button-${item.id}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("faqs.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label="Edit question"
                            data-testid={`faq-edit-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("faqs.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label="Delete question"
                            data-testid={`faq-delete-button-${item.id}`}
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
        title={editingId ? "Edit question" : "New question"}
        description="Fill in at least one language. Empty languages are skipped."
        onClose={() => setFormOpen(false)}
        size="lg"
        testId="faq-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} data-testid="faq-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="faq-form-submit-button">
              {editingId ? "Save changes" : "Create question"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          completeness={{
            id: translations.id.question.trim() !== "" && translations.id.answer.trim() !== "",
            en: translations.en.question.trim() !== "" && translations.en.answer.trim() !== "",
          }}
        />

        <div className="flex flex-col gap-4">
          <Field
            label="Question"
            required
            error={errors[`translations.${locale}.question`] ?? errors.translations}
            testId="faq-question-field"
          >
            <TextInput
              value={active.question}
              onChange={(event) =>
                setTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], question: event.target.value },
                }))
              }
              placeholder="Berapa lama proses pembuatan website?"
              data-testid="faq-question-input"
            />
          </Field>

          <Field
            label="Answer"
            required
            error={errors[`translations.${locale}.answer`]}
            testId="faq-answer-field"
          >
            <TextArea
              rows={6}
              value={active.answer}
              onChange={(event) =>
                setTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], answer: event.target.value },
                }))
              }
              data-testid="faq-answer-input"
            />
          </Field>

          <Field label="Category" error={errors.faq_category_id} testId="faq-category-field">
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              data-testid="faq-category-select"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Featured</span>
              <Switch checked={isFeatured} onChange={setIsFeatured} label="Featured" testId="faq-form-featured-switch" />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
              <Switch checked={isActive} onChange={setIsActive} label="Active" testId="faq-form-active-switch" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.question}” will be removed for good.`
            : `“${pendingDelete?.question}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="faq-delete-dialog"
      />
    </>
  );
}
