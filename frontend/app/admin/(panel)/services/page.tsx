"use client";

import { CircleDollarSign, Gauge, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextArea, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { LOCALES, type LocaleCode, type Service, type ServiceStat } from "@/app/lib/admin/types";

type Tab = "services" | "stats";

type ServiceTranslationState = { title: string; description: string; tags: string };
type StatTranslationState = { unit: string; label: string };

const EMPTY_SERVICE_TRANSLATIONS: Record<LocaleCode, ServiceTranslationState> = {
  id: { title: "", description: "", tags: "" },
  en: { title: "", description: "", tags: "" },
};

const EMPTY_STAT_TRANSLATIONS: Record<LocaleCode, StatTranslationState> = {
  id: { unit: "", label: "" },
  en: { unit: "", label: "" },
};

export default function ServicesPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrashed, setShowTrashed] = useState(false);

  const [serviceForm, setServiceForm] = useState(false);
  const [statForm, setStatForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [serviceTranslations, setServiceTranslations] = useState(EMPTY_SERVICE_TRANSLATIONS);
  const [iconName, setIconName] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("IDR");
  const [durationDays, setDurationDays] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [statTranslations, setStatTranslations] = useState(EMPTY_STAT_TRANSLATIONS);
  const [statValue, setStatValue] = useState("");
  const [statIcon, setStatIcon] = useState("");
  const [statActive, setStatActive] = useState(true);

  const [pendingDelete, setPendingDelete] = useState<{ kind: Tab; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = showTrashed ? "?trashed=1" : "";
      const [serviceResponse, statResponse] = await Promise.all([
        apiRequest<Service[]>(`/admin/services${query}`, { auth: true }),
        apiRequest<ServiceStat[]>(`/admin/service-stats${query}`, { auth: true }),
      ]);
      setServices(serviceResponse.data);
      setStats(statResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load services.");
    } finally {
      setLoading(false);
    }
  }, [showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openServiceCreate = () => {
    setEditingId(null);
    setServiceTranslations({ id: { title: "", description: "", tags: "" }, en: { title: "", description: "", tags: "" } });
    setIconName("");
    setPriceFrom("");
    setPriceCurrency("IDR");
    setDurationDays("");
    setIsFeatured(false);
    setIsActive(true);
    setLocale("id");
    setErrors({});
    setServiceForm(true);
  };

  const openServiceEdit = (item: Service) => {
    setEditingId(item.id);
    setServiceTranslations({
      id: {
        title: item.translations.id?.title ?? "",
        description: item.translations.id?.description ?? "",
        tags: (item.translations.id?.tags ?? []).join(", "),
      },
      en: {
        title: item.translations.en?.title ?? "",
        description: item.translations.en?.description ?? "",
        tags: (item.translations.en?.tags ?? []).join(", "),
      },
    });
    setIconName(item.icon_name ?? "");
    setPriceFrom(item.price_from === null ? "" : String(item.price_from));
    setPriceCurrency(item.price_currency ?? "IDR");
    setDurationDays(item.duration_days === null ? "" : String(item.duration_days));
    setIsFeatured(item.is_featured);
    setIsActive(item.is_active);
    setLocale("id");
    setErrors({});
    setServiceForm(true);
  };

  const openStatCreate = () => {
    setEditingId(null);
    setStatTranslations({ id: { unit: "", label: "" }, en: { unit: "", label: "" } });
    setStatValue("");
    setStatIcon("");
    setStatActive(true);
    setLocale("id");
    setErrors({});
    setStatForm(true);
  };

  const openStatEdit = (item: ServiceStat) => {
    setEditingId(item.id);
    setStatTranslations({
      id: { unit: item.translations.id?.unit ?? "", label: item.translations.id?.label ?? "" },
      en: { unit: item.translations.en?.unit ?? "", label: item.translations.en?.label ?? "" },
    });
    setStatValue(item.value);
    setStatIcon(item.icon_name ?? "");
    setStatActive(item.is_active);
    setLocale("id");
    setErrors({});
    setStatForm(true);
  };

  const applyErrors = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
      setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])));
      toast.error(error.message);
    } else {
      toast.error(error instanceof ApiError ? error.message : fallback);
    }
  };

  const submitService = async () => {
    setSaving(true);
    setErrors({});

    const translations = Object.fromEntries(
      LOCALES.filter(({ code }) => serviceTranslations[code].title.trim() !== "").map(({ code }) => [
        code,
        {
          title: serviceTranslations[code].title.trim(),
          description: serviceTranslations[code].description.trim() || null,
          tags: serviceTranslations[code].tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== ""),
        },
      ]),
    );

    try {
      const body = {
        icon_name: iconName || null,
        price_from: priceFrom === "" ? null : Number(priceFrom),
        price_currency: priceFrom === "" ? null : priceCurrency || null,
        duration_days: durationDays === "" ? null : Number(durationDays),
        is_featured: isFeatured,
        is_active: isActive,
        translations,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/services/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/services", { method: "POST", auth: true, body });

      toast.success(message);
      setServiceForm(false);
      await load();
    } catch (error) {
      applyErrors(error, "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const submitStat = async () => {
    setSaving(true);
    setErrors({});

    const translations = Object.fromEntries(
      LOCALES.filter(
        ({ code }) => statTranslations[code].label.trim() !== "" || statTranslations[code].unit.trim() !== "",
      ).map(({ code }) => [
        code,
        {
          unit: statTranslations[code].unit.trim() || null,
          label: statTranslations[code].label.trim() || null,
        },
      ]),
    );

    try {
      const body = {
        value: statValue,
        icon_name: statIcon || null,
        is_active: statActive,
        translations,
      };

      const { message } = editingId
        ? await apiRequest(`/admin/service-stats/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/service-stats", { method: "POST", auth: true, body });

      toast.success(message);
      setStatForm(false);
      await load();
    } catch (error) {
      applyErrors(error, "Could not save the service stat.");
    } finally {
      setSaving(false);
    }
  };

  const act = async (path: string, method: "PATCH" | "POST" | "DELETE", fallback: string) => {
    try {
      const { message } = await apiRequest(path, { method, auth: true });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : fallback);
    }
  };

  const move = async (kind: Tab, index: number, direction: -1 | 1) => {
    const list = kind === "services" ? [...services] : [...stats];
    const target = index + direction;
    [list[index], list[target]] = [list[target], list[index]];

    if (kind === "services") setServices(list as Service[]);
    else setStats(list as ServiceStat[]);

    const path = kind === "services" ? "/admin/services/reorder" : "/admin/service-stats/reorder";

    try {
      const { message } = await apiRequest(path, {
        method: "POST",
        auth: true,
        body: { items: list.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    const base = pendingDelete.kind === "services" ? "/admin/services" : "/admin/service-stats";
    const path = showTrashed ? `${base}/${pendingDelete.id}/force` : `${base}/${pendingDelete.id}`;

    try {
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });
      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  const activeService = serviceTranslations[locale];
  const activeStat = statTranslations[locale];

  return (
    <>
      <PageBreadcrumb title="Services" trail={[{ label: "Content" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-admin-gray-100 p-1 dark:bg-admin-gray-800" data-testid="service-tabs">
          {(
            [
              ["services", "Services", services.length],
              ["stats", "Stats", stats.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              data-testid={`service-tab-${key}`}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-admin-white text-admin-gray-900 shadow-sm dark:bg-admin-gray-900 dark:text-admin-white/90"
                  : "text-admin-gray-500 hover:text-admin-gray-700 dark:text-admin-gray-400"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <span className="flex-1" />

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((current) => !current)}
          data-testid="service-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("services.create") ? (
          <Button
            onClick={tab === "services" ? openServiceCreate : openStatCreate}
            data-testid="service-create-button"
          >
            <Plus size={16} />
            {tab === "services" ? "New service" : "New stat"}
          </Button>
        ) : null}
      </div>

      <TableCard testId="service-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="service-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : tab === "services" ? (
          services.length === 0 ? (
            <EmptyState
              icon={CircleDollarSign}
              title={showTrashed ? "Trash is empty" : "No services yet"}
              message="Services replace the hardcoded list in the landing page."
              testId="service-empty-state"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                  <tr>
                    <th className="w-10 px-3 py-3" />
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Tags</th>
                    <th className="px-6 py-3">Price from</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                  {services.map((item, index) => (
                    <tr key={item.id} data-testid={`service-row-${item.id}`}>
                      <td className="px-3 py-4">
                        {!showTrashed && can("services.update") ? (
                          <SortButtons
                            onUp={() => void move("services", index, -1)}
                            onDown={() => void move("services", index, 1)}
                            disabledUp={index === 0}
                            disabledDown={index === services.length - 1}
                            testIdPrefix={`service-${item.id}`}
                          />
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-medium text-admin-gray-800 dark:text-admin-white/90">
                          {item.title ?? "—"}
                          {item.is_featured ? (
                            <span className="ml-2 align-middle">
                              <StatusBadge tone="brand">Featured</StatusBadge>
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block max-w-md truncate text-xs text-admin-gray-500 dark:text-admin-gray-400">
                          {item.description ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <StatusBadge key={tag} tone="neutral">
                              {tag}
                            </StatusBadge>
                          ))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">
                        {item.price_from === null
                          ? "—"
                          : `${item.price_currency ?? ""} ${item.price_from.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4">
                        {showTrashed ? (
                          <StatusBadge tone="neutral">Trashed</StatusBadge>
                        ) : can("services.update") ? (
                          <Switch
                            checked={item.is_active}
                            onChange={() =>
                              void act(`/admin/services/${item.id}/toggle-active`, "PATCH", "Could not update.")
                            }
                            label={`Toggle ${item.title ?? "service"}`}
                            testId={`service-toggle-active-${item.id}`}
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
                                void act(`/admin/services/${item.id}/restore`, "POST", "Could not restore.")
                              }
                              aria-label="Restore service"
                              data-testid={`service-restore-button-${item.id}`}
                              className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : can("services.update") ? (
                            <button
                              type="button"
                              onClick={() => openServiceEdit(item)}
                              aria-label="Edit service"
                              data-testid={`service-edit-button-${item.id}`}
                              className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                            >
                              <Pencil size={15} />
                            </button>
                          ) : null}

                          {can("services.delete") ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({ kind: "services", id: item.id, label: item.title ?? "service" })
                              }
                              aria-label="Delete service"
                              data-testid={`service-delete-button-${item.id}`}
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
          )
        ) : stats.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title={showTrashed ? "Trash is empty" : "No stats yet"}
            message="The three numbers shown under the services section."
            testId="stat-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Label</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {stats.map((item, index) => (
                  <tr key={item.id} data-testid={`stat-row-${item.id}`}>
                    <td className="px-3 py-4">
                      {!showTrashed && can("services.update") ? (
                        <SortButtons
                          onUp={() => void move("stats", index, -1)}
                          onDown={() => void move("stats", index, 1)}
                          disabledUp={index === 0}
                          disabledDown={index === stats.length - 1}
                          testIdPrefix={`stat-${item.id}`}
                        />
                      ) : null}
                    </td>
                    <td className="px-6 py-4 font-semibold text-admin-gray-800 dark:text-admin-white/90">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">{item.unit ?? "—"}</td>
                    <td className="px-6 py-4 text-admin-gray-600 dark:text-admin-gray-300">{item.label ?? "—"}</td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("services.update") ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() =>
                            void act(`/admin/service-stats/${item.id}/toggle-active`, "PATCH", "Could not update.")
                          }
                          label={`Toggle ${item.value}`}
                          testId={`stat-toggle-active-${item.id}`}
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
                              void act(`/admin/service-stats/${item.id}/restore`, "POST", "Could not restore.")
                            }
                            aria-label="Restore stat"
                            data-testid={`stat-restore-button-${item.id}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("services.update") ? (
                          <button
                            type="button"
                            onClick={() => openStatEdit(item)}
                            aria-label="Edit stat"
                            data-testid={`stat-edit-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("services.delete") ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete({ kind: "stats", id: item.id, label: item.value })}
                            aria-label="Delete stat"
                            data-testid={`stat-delete-button-${item.id}`}
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
        open={serviceForm}
        title={editingId ? "Edit service" : "New service"}
        description="Tags are comma separated, maximum six per language."
        onClose={() => setServiceForm(false)}
        size="lg"
        testId="service-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setServiceForm(false)} data-testid="service-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submitService()} data-testid="service-form-submit-button">
              {editingId ? "Save changes" : "Create service"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          testIdPrefix="service-"
          completeness={{
            id: serviceTranslations.id.title.trim() !== "",
            en: serviceTranslations.en.title.trim() !== "",
          }}
        />

        <div className="flex flex-col gap-4">
          <Field
            label="Title"
            required
            error={errors[`translations.${locale}.title`] ?? errors.translations}
            testId="service-title-field"
          >
            <TextInput
              value={activeService.title}
              onChange={(event) =>
                setServiceTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], title: event.target.value },
                }))
              }
              placeholder="Landing Page"
              data-testid="service-title-input"
            />
          </Field>

          <Field label="Description" testId="service-description-field">
            <TextArea
              rows={4}
              value={activeService.description}
              onChange={(event) =>
                setServiceTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], description: event.target.value },
                }))
              }
              data-testid="service-description-input"
            />
          </Field>

          <Field label="Tags" hint="Comma separated, for example: High Converting, SEO-Ready" testId="service-tags-field">
            <TextInput
              value={activeService.tags}
              onChange={(event) =>
                setServiceTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], tags: event.target.value },
                }))
              }
              data-testid="service-tags-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Icon name" hint="lucide-react icon, for example Rocket" testId="service-icon-field">
              <TextInput
                value={iconName}
                onChange={(event) => setIconName(event.target.value)}
                data-testid="service-icon-input"
              />
            </Field>

            <Field label="Duration (days)" error={errors.duration_days} testId="service-duration-field">
              <TextInput
                type="number"
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                data-testid="service-duration-input"
              />
            </Field>

            <Field label="Price from" error={errors.price_from} testId="service-price-field">
              <TextInput
                type="number"
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                data-testid="service-price-input"
              />
            </Field>

            <Field label="Currency" error={errors.price_currency} testId="service-currency-field">
              <TextInput
                value={priceCurrency}
                maxLength={3}
                onChange={(event) => setPriceCurrency(event.target.value.toUpperCase())}
                data-testid="service-currency-input"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Featured</span>
              <Switch checked={isFeatured} onChange={setIsFeatured} label="Featured" testId="service-form-featured-switch" />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
              <Switch checked={isActive} onChange={setIsActive} label="Active" testId="service-form-active-switch" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={statForm}
        title={editingId ? "Edit stat" : "New stat"}
        description="The headline number, its unit and a short supporting label."
        onClose={() => setStatForm(false)}
        size="md"
        testId="stat-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatForm(false)} data-testid="stat-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submitStat()} data-testid="stat-form-submit-button">
              {editingId ? "Save changes" : "Create stat"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={locale}
          onChange={setLocale}
          testIdPrefix="stat-"
          completeness={{
            id: statTranslations.id.label.trim() !== "",
            en: statTranslations.en.label.trim() !== "",
          }}
        />

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Value" required error={errors.value} testId="stat-value-field">
              <TextInput
                value={statValue}
                hasError={errors.value !== undefined}
                onChange={(event) => setStatValue(event.target.value)}
                placeholder="98+"
                data-testid="stat-value-input"
              />
            </Field>

            <Field label="Icon name" testId="stat-icon-field">
              <TextInput
                value={statIcon}
                onChange={(event) => setStatIcon(event.target.value)}
                placeholder="Gauge"
                data-testid="stat-icon-input"
              />
            </Field>
          </div>

          <Field label="Unit" error={errors.translations} testId="stat-unit-field">
            <TextInput
              value={activeStat.unit}
              onChange={(event) =>
                setStatTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], unit: event.target.value },
                }))
              }
              placeholder="page speed"
              data-testid="stat-unit-input"
            />
          </Field>

          <Field label="Label" testId="stat-label-field">
            <TextArea
              rows={3}
              value={activeStat.label}
              onChange={(event) =>
                setStatTranslations((current) => ({
                  ...current,
                  [locale]: { ...current[locale], label: event.target.value },
                }))
              }
              data-testid="stat-label-input"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch checked={statActive} onChange={setStatActive} label="Active" testId="stat-form-active-switch" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.label}” will be removed for good.`
            : `“${pendingDelete?.label}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="service-delete-dialog"
      />
    </>
  );
}
