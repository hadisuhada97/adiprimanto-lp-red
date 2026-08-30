"use client";

import { ImagePlus, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Select, Switch, TextArea, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { LOCALES, type LocaleCode, type MediaItem } from "@/app/lib/admin/types";

export type CrudFieldType = "text" | "textarea" | "number" | "color" | "select" | "media" | "switch" | "json";

export type CrudField = {
  key: string;
  label: string;
  type?: CrudFieldType;
  translated?: boolean;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  full?: boolean;
  defaultValue?: string | boolean;
  mediaPreviewKey?: string;
};

export type CrudRow = {
  id: string;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
  translations?: Record<string, Record<string, string | null>>;
} & Record<string, unknown>;

export type CrudColumn = { header: string; render: (row: CrudRow) => ReactNode };

type Values = Record<string, string | boolean | null>;
type Translations = Record<LocaleCode, Record<string, string>>;

export default function CrudSection({
  title,
  description,
  endpoint,
  permission,
  testIdPrefix,
  entityName,
  fields,
  columns,
  labelKey,
  searchable = false,
  hiddenValues = {},
  extraQuery = {},
  reloadToken = 0,
  onChanged,
}: {
  title: string;
  description?: string;
  endpoint: string;
  permission: string;
  testIdPrefix: string;
  entityName: string;
  fields: CrudField[];
  columns: CrudColumn[];
  labelKey: string;
  searchable?: boolean;
  hiddenValues?: Record<string, string>;
  extraQuery?: Record<string, string>;
  reloadToken?: number;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const { can } = useAuth();

  const translatedFields = fields.filter((field) => field.translated === true);
  const plainFields = fields.filter((field) => field.translated !== true);
  const requiredTranslated = translatedFields.find((field) => field.required === true);

  const emptyValues = (): Values =>
    Object.fromEntries(
      plainFields.map((field) => [
        field.key,
        field.defaultValue ?? (field.type === "switch" ? false : field.type === "media" ? null : ""),
      ]),
    );

  const emptyTranslations = (): Translations => ({
    id: Object.fromEntries(translatedFields.map((field) => [field.key, ""])),
    en: Object.fromEntries(translatedFields.map((field) => [field.key, ""])),
  });

  const [rows, setRows] = useState<CrudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [values, setValues] = useState<Values>(emptyValues);
  const [translations, setTranslations] = useState<Translations>(emptyTranslations);
  const [mediaCache, setMediaCache] = useState<Record<string, MediaItem | null>>({});
  const [pickerField, setPickerField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<CrudRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ ...extraQuery });
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const { data } = await apiRequest<CrudRow[]>(`${endpoint}?${query}`, { auth: true });
      setRows(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `Could not load the ${entityName} list.`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, search, showTrashed, JSON.stringify(extraQuery), reloadToken, toast, entityName]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setValues(emptyValues());
    setTranslations(emptyTranslations());
    setMediaCache({});
    setLocale("id");
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: CrudRow) => {
    setEditingId(row.id);

    setValues(
      Object.fromEntries(
        plainFields.map((field) => {
          const raw = row[field.key];

          if (field.type === "switch") return [field.key, raw === true];
          if (field.type === "media") return [field.key, typeof raw === "string" ? raw : null];
          if (field.type === "json") {
            return [field.key, raw === null || raw === undefined ? "" : JSON.stringify(raw, null, 2)];
          }

          return [field.key, raw === null || raw === undefined ? "" : String(raw)];
        }),
      ),
    );

    setTranslations({
      id: Object.fromEntries(
        translatedFields.map((field) => [field.key, row.translations?.id?.[field.key] ?? ""]),
      ),
      en: Object.fromEntries(
        translatedFields.map((field) => [field.key, row.translations?.en?.[field.key] ?? ""]),
      ),
    });

    setMediaCache(
      Object.fromEntries(
        plainFields
          .filter((field) => field.type === "media")
          .map((field) => [
            field.key,
            (row[field.mediaPreviewKey ?? "media"] as MediaItem | null | undefined) ?? null,
          ]),
      ),
    );

    setLocale("id");
    setErrors({});
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    const body: Record<string, unknown> = { ...hiddenValues };

    for (const field of plainFields) {
      const value = values[field.key];

      if (field.type === "switch") {
        body[field.key] = value === true;
      } else if (field.type === "number") {
        body[field.key] = value === "" || value === null ? null : Number(value);
      } else if (field.type === "json") {
        if (value === "" || value === null) {
          body[field.key] = null;
        } else {
          try {
            body[field.key] = JSON.parse(String(value));
          } catch {
            setErrors({ [field.key]: "This must be valid JSON." });
            toast.error("Please fix the JSON before saving.");
            setSaving(false);
            return;
          }
        }
      } else {
        body[field.key] = value === "" || value === null ? null : value;
      }
    }

    if (translatedFields.length > 0) {
      body.translations = Object.fromEntries(
        LOCALES.filter(({ code }) =>
          requiredTranslated
            ? translations[code][requiredTranslated.key].trim() !== ""
            : translatedFields.some((field) => translations[code][field.key].trim() !== ""),
        ).map(({ code }) => [
          code,
          Object.fromEntries(
            translatedFields.map((field) => [field.key, translations[code][field.key].trim() || null]),
          ),
        ]),
      );
    }

    try {
      const { message } = editingId
        ? await apiRequest(`${endpoint}/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest(endpoint, { method: "POST", auth: true, body });

      toast.success(message);
      setModalOpen(false);
      await load();
      onChanged?.();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : `Could not save the ${entityName}.`);
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
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : fallback);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...rows];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);

    try {
      const { message } = await apiRequest(`${endpoint}/reorder`, {
        method: "POST",
        auth: true,
        body: { items: next.map((row, position) => ({ id: row.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the new order.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `${endpoint}/${pendingDelete.id}/force`
        : `${endpoint}/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `Could not delete the ${entityName}.`);
    } finally {
      setDeleting(false);
    }
  };

  const renderField = (field: CrudField) => {
    const error = field.translated === true ? errors[`translations.${locale}.${field.key}`] : errors[field.key];
    const value = field.translated === true ? translations[locale][field.key] : values[field.key];

    const setValue = (next: string | boolean | null) => {
      if (field.translated === true) {
        setTranslations((state) => ({
          ...state,
          [locale]: { ...state[locale], [field.key]: String(next) },
        }));
      } else {
        setValues((state) => ({ ...state, [field.key]: next }));
      }
    };

    if (field.type === "switch") {
      return (
        <div
          key={field.key}
          className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800"
          data-testid={`${testIdPrefix}-field-${field.key}`}
        >
          <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">{field.label}</span>
          <Switch
            checked={value === true}
            onChange={(next) => setValue(next)}
            label={field.label}
            testId={`${testIdPrefix}-switch-${field.key}`}
          />
        </div>
      );
    }

    const control = (() => {
      if (field.type === "media") {
        const media = mediaCache[field.key] ?? null;

        return (
          <div className="flex items-center gap-3">
            {media ? (
              <span className="relative">
                <Image
                  src={media.url}
                  alt={media.alt_text ?? field.label}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMediaCache((state) => ({ ...state, [field.key]: null }));
                    setValues((state) => ({ ...state, [field.key]: null }));
                  }}
                  aria-label={`Remove ${field.label}`}
                  data-testid={`${testIdPrefix}-media-remove-${field.key}`}
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-error-500 p-0.5 text-admin-white"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => setPickerField(field.key)}
              data-testid={`${testIdPrefix}-media-pick-${field.key}`}
            >
              <ImagePlus size={16} />
              {media ? "Change" : "Select image"}
            </Button>
          </div>
        );
      }

      if (field.type === "select") {
        return (
          <Select
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setValue(event.target.value)}
            data-testid={`${testIdPrefix}-select-${field.key}`}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      }

      if (field.type === "textarea" || field.type === "json") {
        return (
          <TextArea
            rows={field.type === "json" ? 6 : 4}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(event) => setValue(event.target.value)}
            data-testid={`${testIdPrefix}-input-${field.key}`}
          />
        );
      }

      if (field.type === "color") {
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={typeof value === "string" && value !== "" ? value : "#465fff"}
              onChange={(event) => setValue(event.target.value)}
              aria-label={`Pick ${field.label}`}
              data-testid={`${testIdPrefix}-color-picker-${field.key}`}
              className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
            />
            <TextInput
              value={typeof value === "string" ? value : ""}
              hasError={error !== undefined}
              onChange={(event) => setValue(event.target.value)}
              data-testid={`${testIdPrefix}-input-${field.key}`}
            />
          </div>
        );
      }

      return (
        <TextInput
          type={field.type === "number" ? "number" : "text"}
          value={typeof value === "string" ? value : ""}
          hasError={error !== undefined}
          placeholder={field.placeholder}
          onChange={(event) => setValue(event.target.value)}
          data-testid={`${testIdPrefix}-input-${field.key}`}
        />
      );
    })();

    return (
      <Field
        key={field.key}
        label={field.label}
        required={field.required}
        hint={field.hint}
        error={field.key === requiredTranslated?.key ? (error ?? errors.translations) : error}
        testId={`${testIdPrefix}-field-${field.key}`}
      >
        {control}
      </Field>
    );
  };

  const rowLabel = (row: CrudRow | null): string => {
    if (row === null) return "";
    const value = row[labelKey];

    return typeof value === "string" ? value : row.id;
  };

  return (
    <section
      className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
      data-testid={`${testIdPrefix}-section`}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">{title}</h3>
          {description ? (
            <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">{description}</p>
          ) : null}
        </div>

        {searchable ? (
          <div className="relative lg:w-64">
            <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              data-testid={`${testIdPrefix}-search-input`}
              className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
            />
          </div>
        ) : null}

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((state) => !state)}
          data-testid={`${testIdPrefix}-trash-toggle-button`}
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can(`${permission}.create`) ? (
          <Button onClick={openCreate} data-testid={`${testIdPrefix}-create-button`}>
            <Plus size={16} />
            New {entityName}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16" data-testid={`${testIdPrefix}-loading`}>
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : rows.length === 0 ? (
        <p
          className="py-12 text-center text-sm text-admin-gray-500 dark:text-admin-gray-400"
          data-testid={`${testIdPrefix}-empty-state`}
        >
          {showTrashed ? "Trash is empty." : `No ${entityName} yet.`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-admin-gray-200 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:text-admin-gray-400">
              <tr>
                <th className="w-10 py-3 pr-2" />
                {columns.map((column) => (
                  <th key={column.header} className="px-4 py-3">
                    {column.header}
                  </th>
                ))}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
              {rows.map((row, index) => (
                <tr key={row.id} data-testid={`${testIdPrefix}-row-${row.id}`}>
                  <td className="py-3 pr-2">
                    {!showTrashed && can(`${permission}.update`) ? (
                      <SortButtons
                        onUp={() => void move(index, -1)}
                        onDown={() => void move(index, 1)}
                        disabledUp={index === 0}
                        disabledDown={index === rows.length - 1}
                        testIdPrefix={`${testIdPrefix}-${row.id}`}
                      />
                    ) : null}
                  </td>

                  {columns.map((column) => (
                    <td key={column.header} className="px-4 py-3 text-admin-gray-700 dark:text-admin-gray-300">
                      {column.render(row)}
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    {showTrashed ? (
                      <StatusBadge tone="neutral">Trashed</StatusBadge>
                    ) : can(`${permission}.update`) ? (
                      <Switch
                        checked={row.is_active}
                        onChange={() =>
                          void act(`${endpoint}/${row.id}/toggle-active`, "PATCH", "Could not update.")
                        }
                        label={`Toggle ${rowLabel(row)}`}
                        testId={`${testIdPrefix}-toggle-active-${row.id}`}
                      />
                    ) : (
                      <StatusBadge tone={row.is_active ? "success" : "neutral"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {showTrashed ? (
                        <button
                          type="button"
                          onClick={() => void act(`${endpoint}/${row.id}/restore`, "POST", "Could not restore.")}
                          aria-label={`Restore ${entityName}`}
                          data-testid={`${testIdPrefix}-restore-button-${row.id}`}
                          className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : can(`${permission}.update`) ? (
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          aria-label={`Edit ${entityName}`}
                          data-testid={`${testIdPrefix}-edit-button-${row.id}`}
                          className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                        >
                          <Pencil size={15} />
                        </button>
                      ) : null}

                      {can(`${permission}.delete`) ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          aria-label={`Delete ${entityName}`}
                          data-testid={`${testIdPrefix}-delete-button-${row.id}`}
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

      <Modal
        open={modalOpen}
        title={`${editingId ? "Edit" : "New"} ${entityName}`}
        description={
          translatedFields.length > 0
            ? "Fill in at least one language. Empty languages are skipped."
            : undefined
        }
        onClose={() => setModalOpen(false)}
        size="lg"
        testId={`${testIdPrefix}-form-modal`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              data-testid={`${testIdPrefix}-form-cancel-button`}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid={`${testIdPrefix}-form-submit-button`}>
              {editingId ? "Save changes" : `Create ${entityName}`}
            </Button>
          </>
        }
      >
        {translatedFields.length > 0 ? (
          <LocaleTabs
            active={locale}
            onChange={setLocale}
            testIdPrefix={`${testIdPrefix}-`}
            completeness={{
              id: requiredTranslated ? translations.id[requiredTranslated.key].trim() !== "" : true,
              en: requiredTranslated ? translations.en[requiredTranslated.key].trim() !== "" : true,
            }}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.full === true ? "sm:col-span-2" : undefined}>
              {renderField(field)}
            </div>
          ))}
        </div>
      </Modal>

      <MediaPicker
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        selectedId={pickerField === null ? null : (values[pickerField] as string | null)}
        onSelect={(item) => {
          if (pickerField !== null) {
            setValues((state) => ({ ...state, [pickerField]: item.id }));
            setMediaCache((state) => ({ ...state, [pickerField]: item }));
          }
          setPickerField(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${rowLabel(pendingDelete)}” will be removed for good.`
            : `“${rowLabel(pendingDelete)}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId={`${testIdPrefix}-delete-dialog`}
      />
    </section>
  );
}
