"use client";

import { Check, Languages, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
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
import type { LocaleRecord, TranslationCoverage } from "@/app/lib/admin/types";

const EMPTY = { code: "", name: "", native_name: "", is_active: true };

export default function LocalizationPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [locales, setLocales] = useState<LocaleRecord[]>([]);
  const [coverage, setCoverage] = useState<TranslationCoverage | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<LocaleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [localeResponse, coverageResponse] = await Promise.all([
        apiRequest<LocaleRecord[]>("/admin/locales", { auth: true }),
        apiRequest<TranslationCoverage>("/admin/locales/completeness", { auth: true }),
      ]);

      setLocales(localeResponse.data);
      setCoverage(coverageResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the locales.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setErrors({});

    try {
      const { message } = editingId
        ? await apiRequest(`/admin/locales/${editingId}`, { method: "PATCH", auth: true, body: values })
        : await apiRequest("/admin/locales", { method: "POST", auth: true, body: values });

      toast.success(message);
      setModalOpen(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])));
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the locale.");
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

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const { message } = await apiRequest(`/admin/locales/${pendingDelete.id}`, {
        method: "DELETE",
        auth: true,
      });
      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the locale.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Localization" trail={[{ label: "Settings" }]} />

      <div className="mb-5 flex items-center justify-between">
        <p className="max-w-2xl text-sm text-admin-gray-500 dark:text-admin-gray-400">
          Locales drive the language tabs across every content module. Content without a
          translation automatically falls back to the default locale.
        </p>

        {can("locales.create") ? (
          <Button
            onClick={() => {
              setEditingId(null);
              setValues(EMPTY);
              setErrors({});
              setModalOpen(true);
            }}
            data-testid="locale-create-button"
          >
            <Plus size={16} />
            New locale
          </Button>
        ) : null}
      </div>

      <TableCard testId="locale-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="locale-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : locales.length === 0 ? (
          <EmptyState
            icon={Languages}
            title="No locales yet"
            message="Add at least one locale so content can be written and published."
            testId="locale-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">Locale</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Default</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {locales.map((locale) => (
                  <tr key={locale.id} data-testid={`locale-row-${locale.code}`}>
                    <td className="px-6 py-3">
                      <span className="font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {locale.name}
                      </span>
                      <span className="ml-2 text-xs text-admin-gray-400">{locale.native_name}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs uppercase">{locale.code}</td>
                    <td className="px-6 py-3">
                      {locale.is_default ? (
                        <StatusBadge tone="brand">Default</StatusBadge>
                      ) : can("locales.update") ? (
                        <button
                          type="button"
                          onClick={() =>
                            void act(`/admin/locales/${locale.id}/set-default`, "PATCH", "Could not set the default.")
                          }
                          data-testid={`locale-set-default-button-${locale.code}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-admin-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                        >
                          <Star size={13} />
                          Make default
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {can("locales.update") ? (
                        <Switch
                          checked={locale.is_active}
                          onChange={() =>
                            void act(
                              `/admin/locales/${locale.id}/toggle-active`,
                              "PATCH",
                              "Could not update the locale.",
                            )
                          }
                          label={`Toggle ${locale.name}`}
                          testId={`locale-toggle-active-${locale.code}`}
                        />
                      ) : (
                        <StatusBadge tone={locale.is_active ? "success" : "neutral"}>
                          {locale.is_active ? "Active" : "Inactive"}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {can("locales.update") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(locale.id);
                              setValues({
                                code: locale.code,
                                name: locale.name,
                                native_name: locale.native_name,
                                is_active: locale.is_active,
                              });
                              setErrors({});
                              setModalOpen(true);
                            }}
                            aria-label="Edit locale"
                            data-testid={`locale-edit-button-${locale.code}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("locales.delete") && !locale.is_default ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(locale)}
                            aria-label="Delete locale"
                            data-testid={`locale-delete-button-${locale.code}`}
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

      {coverage ? (
        <section
          className="mt-6 rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
          data-testid="locale-coverage"
        >
          <h3 className="mb-1 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
            Translation coverage
          </h3>
          <p className="mb-5 text-sm text-admin-gray-500 dark:text-admin-gray-400">
            How many records already have a translation row per locale.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:text-admin-gray-400">
                <tr>
                  <th className="py-3 pr-4">Module</th>
                  <th className="px-4 py-3">Records</th>
                  {coverage.locales.map((code) => (
                    <th key={code} className="px-4 py-3 uppercase">
                      {code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {coverage.modules.map((row) => (
                  <tr key={row.module} data-testid={`coverage-row-${row.module.replace(/\s+/g, "-").toLowerCase()}`}>
                    <td className="py-3 pr-4 text-admin-gray-700 dark:text-admin-gray-300">{row.module}</td>
                    <td className="px-4 py-3 text-admin-gray-500 dark:text-admin-gray-400">{row.total}</td>
                    {coverage.locales.map((code) => {
                      const done = row.translated[code] ?? 0;
                      const complete = row.total > 0 && done >= row.total;

                      return (
                        <td key={code} className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              complete
                                ? "text-success-500"
                                : done === 0
                                  ? "text-admin-gray-400"
                                  : "text-warning-500"
                            }`}
                          >
                            {complete ? <Check size={13} /> : null}
                            {done}/{row.total}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Modal
        open={modalOpen}
        title={`${editingId ? "Edit" : "New"} locale`}
        onClose={() => setModalOpen(false)}
        size="sm"
        testId="locale-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} data-testid="locale-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="locale-form-submit-button">
              {editingId ? "Save changes" : "Create locale"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Code" required error={errors.code} hint="Two letters, or “en-US”." testId="locale-field-code">
            <TextInput
              value={values.code}
              hasError={errors.code !== undefined}
              onChange={(event) => setValues((state) => ({ ...state, code: event.target.value }))}
              placeholder="jv"
              data-testid="locale-input-code"
            />
          </Field>

          <Field label="Name" required error={errors.name} testId="locale-field-name">
            <TextInput
              value={values.name}
              hasError={errors.name !== undefined}
              onChange={(event) => setValues((state) => ({ ...state, name: event.target.value }))}
              placeholder="Javanese"
              data-testid="locale-input-name"
            />
          </Field>

          <Field label="Native name" required error={errors.native_name} testId="locale-field-native-name">
            <TextInput
              value={values.native_name}
              hasError={errors.native_name !== undefined}
              onChange={(event) => setValues((state) => ({ ...state, native_name: event.target.value }))}
              placeholder="Basa Jawa"
              data-testid="locale-input-native-name"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={values.is_active}
              onChange={(next) => setValues((state) => ({ ...state, is_active: next }))}
              label="Active"
              testId="locale-switch-is-active"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Move locale to trash"
        message={`“${pendingDelete?.name ?? ""}” will be moved to the trash. Existing translations stay untouched.`}
        confirmLabel="Move to trash"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="locale-delete-dialog"
      />
    </>
  );
}
