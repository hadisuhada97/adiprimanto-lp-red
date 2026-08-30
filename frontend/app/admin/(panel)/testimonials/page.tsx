"use client";

import { ImagePlus, Loader2, MessageSquareQuote, Pencil, Plus, RotateCcw, Search, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
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
import {
  LOCALES,
  type LocaleCode,
  type MediaItem,
  type Testimonial,
  type TestimonialTranslation,
} from "@/app/lib/admin/types";

type TranslationState = Record<LocaleCode, TestimonialTranslation>;

const EMPTY_TRANSLATION: TestimonialTranslation = {
  name: "",
  role: "",
  company: "",
  project_label: "",
  feedback: "",
};

const EMPTY_TRANSLATIONS: TranslationState = {
  id: { ...EMPTY_TRANSLATION },
  en: { ...EMPTY_TRANSLATION },
};

export default function TestimonialsPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [translations, setTranslations] = useState<TranslationState>(EMPTY_TRANSLATIONS);
  const [rating, setRating] = useState(5);
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [source, setSource] = useState<Testimonial["source"]>("manual");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [avatar, setAvatar] = useState<MediaItem | null>(null);
  const [screenshot, setScreenshot] = useState<MediaItem | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"avatar" | "screenshot" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const { data } = await apiRequest<Testimonial[]>(`/admin/testimonials?${query}`, { auth: true });
      setItems(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load testimonials.");
    } finally {
      setLoading(false);
    }
  }, [search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setTranslations({ id: { ...EMPTY_TRANSLATION }, en: { ...EMPTY_TRANSLATION } });
    setRating(5);
    setAccentColor("#ef4444");
    setSource("manual");
    setIsFeatured(false);
    setIsActive(true);
    setAvatar(null);
    setScreenshot(null);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setTranslations({
      id: { ...EMPTY_TRANSLATION, ...(item.translations.id ?? {}) },
      en: { ...EMPTY_TRANSLATION, ...(item.translations.en ?? {}) },
    });
    setRating(item.rating);
    setAccentColor(item.accent_color ?? "#ef4444");
    setSource(item.source);
    setIsFeatured(item.is_featured);
    setIsActive(item.is_active);
    setAvatar(item.avatar ?? null);
    setScreenshot(item.screenshot ?? null);
    setLocale("id");
    setErrors({});
    setFormOpen(true);
  };

  const patch = (field: keyof TestimonialTranslation, value: string) => {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [field]: value },
    }));
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    const payloadTranslations = Object.fromEntries(
      LOCALES.filter(({ code }) => (translations[code].name ?? "").trim() !== "").map(({ code }) => [
        code,
        {
          name: translations[code].name.trim(),
          role: translations[code].role?.trim() || null,
          company: translations[code].company?.trim() || null,
          project_label: translations[code].project_label?.trim() || null,
          feedback: translations[code].feedback.trim(),
        },
      ]),
    );

    try {
      const body = {
        rating,
        accent_color: accentColor || null,
        source,
        is_featured: isFeatured,
        is_active: isActive,
        avatar_media_id: avatar?.id ?? null,
        screenshot_media_id: screenshot?.id ?? null,
        translations: payloadTranslations,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/testimonials/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/testimonials", { method: "POST", auth: true, body });

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
        toast.error(error instanceof ApiError ? error.message : "Could not save the testimonial.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Testimonial) => {
    try {
      const { message } = await apiRequest(`/admin/testimonials/${item.id}/toggle-active`, {
        method: "PATCH",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the testimonial.");
    }
  };

  const restore = async (item: Testimonial) => {
    try {
      const { message } = await apiRequest(`/admin/testimonials/${item.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore the testimonial.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    try {
      const { message } = await apiRequest("/admin/testimonials/reorder", {
        method: "POST",
        auth: true,
        body: { items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder testimonials.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/testimonials/${pendingDelete.id}/force`
        : `/admin/testimonials/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the testimonial.");
    } finally {
      setDeleting(false);
    }
  };

  const active = translations[locale];

  return (
    <>
      <PageBreadcrumb title="Testimonials" trail={[{ label: "Content" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client name or feedback"
            data-testid="testimonial-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="testimonial-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("testimonials.create") ? (
          <Button onClick={openCreate} data-testid="testimonial-create-button">
            <Plus size={16} />
            New testimonial
          </Button>
        ) : null}
      </div>

      <TableCard testId="testimonial-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="testimonial-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title={showTrashed ? "Trash is empty" : "No testimonials yet"}
            message={
              showTrashed
                ? "Deleted testimonials show up here and can be restored."
                : "Add the client quotes that used to be hardcoded in the landing page."
            }
            action={
              !showTrashed && can("testimonials.create") ? (
                <Button onClick={openCreate} data-testid="testimonial-empty-create-button">
                  <Plus size={16} />
                  New testimonial
                </Button>
              ) : undefined
            }
            testId="testimonial-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {items.map((item, index) => (
                  <tr key={item.id} data-testid={`testimonial-row-${item.id}`}>
                    <td className="px-3 py-4">
                      {!showTrashed && can("testimonials.update") ? (
                        <SortButtons
                          onUp={() => void move(index, -1)}
                          onDown={() => void move(index, 1)}
                          disabledUp={index === 0}
                          disabledDown={index === items.length - 1}
                          testIdPrefix={`testimonial-${item.id}`}
                        />
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-3">
                        {item.avatar?.url ? (
                          <Image
                            src={item.avatar.url}
                            alt={item.name ?? ""}
                            width={36}
                            height={36}
                            unoptimized
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-admin-white"
                            style={{ backgroundColor: item.accent_color ?? "#465fff" }}
                          >
                            {(item.name ?? "?").slice(0, 1)}
                          </span>
                        )}
                        <span>
                          <span className="block font-medium text-admin-gray-800 dark:text-admin-white/90">
                            {item.name ?? "—"}
                            {item.is_featured ? (
                              <span className="ml-2 align-middle">
                                <StatusBadge tone="brand">Featured</StatusBadge>
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-xs text-admin-gray-500 dark:text-admin-gray-400">
                            {[item.role, item.company].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="max-w-xs px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                      {item.project_label ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-0.5 text-warning-500">
                        {Array.from({ length: item.rating }).map((_, star) => (
                          <Star key={star} size={13} fill="currentColor" />
                        ))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("testimonials.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() => void toggleActive(item)}
                          label={`Toggle ${item.name ?? "testimonial"}`}
                          testId={`testimonial-toggle-active-${item.id}`}
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
                            aria-label="Restore testimonial"
                            data-testid={`testimonial-restore-button-${item.id}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("testimonials.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label="Edit testimonial"
                            data-testid={`testimonial-edit-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("testimonials.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label="Delete testimonial"
                            data-testid={`testimonial-delete-button-${item.id}`}
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
        title={editingId ? "Edit testimonial" : "New testimonial"}
        description="Fill in at least one language. Empty languages are skipped."
        onClose={() => setFormOpen(false)}
        size="lg"
        testId="testimonial-form-modal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFormOpen(false)}
              data-testid="testimonial-form-cancel-button"
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="testimonial-form-submit-button">
              {editingId ? "Save changes" : "Create testimonial"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          completeness={{
            id: translations.id.name.trim() !== "" && translations.id.feedback.trim() !== "",
            en: translations.en.name.trim() !== "" && translations.en.feedback.trim() !== "",
          }}
        />

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Client name"
              required
              error={errors[`translations.${locale}.name`]}
              testId="testimonial-name-field"
            >
              <TextInput
                value={active.name}
                onChange={(event) => patch("name", event.target.value)}
                placeholder="Asih Angger"
                data-testid="testimonial-name-input"
              />
            </Field>

            <Field label="Role" error={errors[`translations.${locale}.role`]} testId="testimonial-role-field">
              <TextInput
                value={active.role ?? ""}
                onChange={(event) => patch("role", event.target.value)}
                placeholder="Photographer"
                data-testid="testimonial-role-input"
              />
            </Field>

            <Field label="Company" testId="testimonial-company-field">
              <TextInput
                value={active.company ?? ""}
                onChange={(event) => patch("company", event.target.value)}
                placeholder="DKN Digital"
                data-testid="testimonial-company-input"
              />
            </Field>

            <Field label="Project label" testId="testimonial-project-field">
              <TextInput
                value={active.project_label ?? ""}
                onChange={(event) => patch("project_label", event.target.value)}
                placeholder="Website Company Profile"
                data-testid="testimonial-project-input"
              />
            </Field>
          </div>

          <Field
            label="Feedback"
            required
            error={errors[`translations.${locale}.feedback`]}
            testId="testimonial-feedback-field"
          >
            <TextArea
              rows={5}
              value={active.feedback}
              onChange={(event) => patch("feedback", event.target.value)}
              placeholder="What the client said…"
              data-testid="testimonial-feedback-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rating" error={errors.rating} testId="testimonial-rating-field">
              <Select
                value={String(rating)}
                onChange={(event) => setRating(Number(event.target.value))}
                data-testid="testimonial-rating-select"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Source" testId="testimonial-source-field">
              <Select
                value={source}
                onChange={(event) => setSource(event.target.value as Testimonial["source"])}
                data-testid="testimonial-source-select"
              >
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </Select>
            </Field>

            <Field label="Accent colour" error={errors.accent_color} testId="testimonial-accent-field">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  aria-label="Pick accent colour"
                  data-testid="testimonial-accent-picker"
                  className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
                />
                <TextInput
                  value={accentColor}
                  hasError={errors.accent_color !== undefined}
                  onChange={(event) => setAccentColor(event.target.value)}
                  data-testid="testimonial-accent-input"
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["avatar", avatar, setAvatar, "Avatar"],
                ["screenshot", screenshot, setScreenshot, "Screenshot"],
              ] as const
            ).map(([key, value, setter, label]) => (
              <Field key={key} label={label} testId={`testimonial-${key}-field`}>
                <div className="flex items-center gap-3">
                  {value ? (
                    <span className="relative">
                      <Image
                        src={value.url}
                        alt={value.alt_text ?? label}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setter(null)}
                        aria-label={`Remove ${label}`}
                        data-testid={`testimonial-${key}-remove`}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-error-500 p-0.5 text-admin-white"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={() => setPickerTarget(key)}
                    data-testid={`testimonial-${key}-pick-button`}
                  >
                    <ImagePlus size={16} />
                    {value ? "Change" : "Select image"}
                  </Button>
                </div>
              </Field>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Featured</span>
              <Switch
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Featured"
                testId="testimonial-form-featured-switch"
              />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Active"
                testId="testimonial-form-active-switch"
              />
            </div>
          </div>
        </div>
      </Modal>

      <MediaPicker
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        selectedId={pickerTarget === "avatar" ? avatar?.id : screenshot?.id}
        onSelect={(media) => {
          if (pickerTarget === "avatar") setAvatar(media);
          if (pickerTarget === "screenshot") setScreenshot(media);
          setPickerTarget(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `The testimonial from “${pendingDelete?.name}” will be removed for good.`
            : `The testimonial from “${pendingDelete?.name}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="testimonial-delete-dialog"
      />
    </>
  );
}
