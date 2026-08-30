"use client";

import { Gauge, ImagePlus, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import {
  LOCALES,
  type HeroContent,
  type HeroMetric,
  type HeroSection,
  type LocaleCode,
  type MediaItem,
} from "@/app/lib/admin/types";

const GROUPS: { title: string; hint: string; fields: (keyof HeroContent)[] }[] = [
  { title: "Badge & role", hint: "The small pill above the headline.", fields: ["badge", "role"] },
  {
    title: "Headline",
    hint: "Rendered as: line 1 → highlighted words → outlined word.",
    fields: ["headline_line_1", "headline_highlight", "headline_stroke"],
  },
  {
    title: "Description",
    hint: "The middle part is displayed in bold.",
    fields: ["description_prefix", "description_strong", "description_suffix"],
  },
  { title: "Call to action", hint: "Button labels.", fields: ["primary_cta_label", "secondary_cta_label"] },
  {
    title: "Trusted line",
    hint: "Social proof under the buttons.",
    fields: ["trusted_prefix", "trusted_strong", "trusted_suffix"],
  },
];

const LABELS: Record<keyof HeroContent, string> = {
  badge: "Badge text",
  role: "Role",
  headline_line_1: "Line 1",
  headline_highlight: "Highlighted words",
  headline_stroke: "Outlined word",
  description_prefix: "Prefix",
  description_strong: "Bold part",
  description_suffix: "Suffix",
  primary_cta_label: "Primary button",
  secondary_cta_label: "Secondary button",
  trusted_prefix: "Prefix",
  trusted_strong: "Bold part",
  trusted_suffix: "Suffix",
};

const EMPTY_CONTENT = Object.fromEntries(
  Object.keys(LABELS).map((key) => [key, ""]),
) as Record<keyof HeroContent, string>;

type ContentState = Record<LocaleCode, Record<keyof HeroContent, string>>;

export default function HeroPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [hero, setHero] = useState<HeroSection | null>(null);
  const [content, setContent] = useState<ContentState>({ id: EMPTY_CONTENT, en: EMPTY_CONTENT });
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [badgeIcon, setBadgeIcon] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [profile, setProfile] = useState<MediaItem | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [metrics, setMetrics] = useState<HeroMetric[]>([]);
  const [showTrashed, setShowTrashed] = useState(false);
  const [metricModal, setMetricModal] = useState(false);
  const [metricId, setMetricId] = useState<string | null>(null);
  const [metricLocale, setMetricLocale] = useState<LocaleCode>("id");
  const [metricLabels, setMetricLabels] = useState<Record<LocaleCode, string>>({ id: "", en: "" });
  const [metricValue, setMetricValue] = useState("");
  const [metricIcon, setMetricIcon] = useState("");
  const [metricColor, setMetricColor] = useState("#eab308");
  const [metricActive, setMetricActive] = useState(true);
  const [metricErrors, setMetricErrors] = useState<Record<string, string>>({});
  const [metricSaving, setMetricSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HeroMetric | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [heroResponse, metricResponse] = await Promise.all([
        apiRequest<HeroSection>("/admin/hero", { auth: true }),
        apiRequest<HeroMetric[]>(`/admin/hero-metrics${showTrashed ? "?trashed=1" : ""}`, { auth: true }),
      ]);

      const data = heroResponse.data;
      setHero(data);
      setContent({
        id: { ...EMPTY_CONTENT, ...cleaned(data.translations.id) },
        en: { ...EMPTY_CONTENT, ...cleaned(data.translations.en) },
      });
      setBadgeIcon(data.badge_icon ?? "");
      setPrimaryUrl(data.primary_cta_url ?? "");
      setSecondaryUrl(data.secondary_cta_url ?? "");
      setProfile(data.profile ?? null);
      setIsActive(data.is_active);
      setMetrics(metricResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the hero section.");
    } finally {
      setLoading(false);
    }
  }, [showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveHero = async () => {
    setSaving(true);
    try {
      const translations = Object.fromEntries(
        LOCALES.map(({ code }) => [
          code,
          Object.fromEntries(
            Object.keys(LABELS).map((key) => [key, content[code][key as keyof HeroContent].trim() || null]),
          ),
        ]),
      );

      const { message } = await apiRequest("/admin/hero", {
        method: "PATCH",
        auth: true,
        body: {
          badge_icon: badgeIcon || null,
          primary_cta_url: primaryUrl || null,
          secondary_cta_url: secondaryUrl || null,
          profile_media_id: profile?.id ?? null,
          is_active: isActive,
          translations,
        },
      });

      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the hero section.");
    } finally {
      setSaving(false);
    }
  };

  const openMetricCreate = () => {
    setMetricId(null);
    setMetricLabels({ id: "", en: "" });
    setMetricValue("");
    setMetricIcon("");
    setMetricColor("#eab308");
    setMetricActive(true);
    setMetricLocale("id");
    setMetricErrors({});
    setMetricModal(true);
  };

  const openMetricEdit = (metric: HeroMetric) => {
    setMetricId(metric.id);
    setMetricLabels({
      id: metric.translations.id?.label ?? "",
      en: metric.translations.en?.label ?? "",
    });
    setMetricValue(metric.value);
    setMetricIcon(metric.icon_name ?? "");
    setMetricColor(metric.color_hex ?? "#eab308");
    setMetricActive(metric.is_active);
    setMetricLocale("id");
    setMetricErrors({});
    setMetricModal(true);
  };

  const saveMetric = async () => {
    setMetricSaving(true);
    setMetricErrors({});

    const translations = Object.fromEntries(
      LOCALES.filter(({ code }) => metricLabels[code].trim() !== "").map(({ code }) => [
        code,
        { label: metricLabels[code].trim() },
      ]),
    );

    try {
      const body = {
        value: metricValue,
        icon_name: metricIcon || null,
        color_hex: metricColor || null,
        is_active: metricActive,
        translations,
      };

      const { message } = metricId
        ? await apiRequest(`/admin/hero-metrics/${metricId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/hero-metrics", { method: "POST", auth: true, body });

      toast.success(message);
      setMetricModal(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setMetricErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the metric.");
      }
    } finally {
      setMetricSaving(false);
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
    const next = [...metrics];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setMetrics(next);

    try {
      const { message } = await apiRequest("/admin/hero-metrics/reorder", {
        method: "POST",
        auth: true,
        body: { items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder the metrics.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/hero-metrics/${pendingDelete.id}/force`
        : `/admin/hero-metrics/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the metric.");
    } finally {
      setDeleting(false);
    }
  };

  const editable = can("hero_sections.update");
  const current = content[locale];

  return (
    <>
      <PageBreadcrumb title="Hero Section" trail={[{ label: "Content" }]} />

      {loading ? (
        <div className="flex justify-center py-24" data-testid="hero-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-6" data-testid="hero-page">
          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <h3 className="mb-1 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Hero copy
            </h3>
            <p className="mb-4 text-sm text-admin-gray-500 dark:text-admin-gray-400">
              Every field maps to a part of the opening section on the landing page.
            </p>

            <LocaleTabs
              active={locale}
              onChange={setLocale}
              completeness={{
                id: content.id.headline_line_1.trim() !== "",
                en: content.en.headline_line_1.trim() !== "",
              }}
            />

            <div className="flex flex-col gap-6">
              {GROUPS.map((group) => (
                <div key={group.title} data-testid={`hero-group-${group.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  <p className="mb-3 text-xs font-semibold tracking-wide text-admin-gray-500 uppercase dark:text-admin-gray-400">
                    {group.title}
                    <span className="ml-2 font-normal normal-case opacity-70">{group.hint}</span>
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {group.fields.map((field) => (
                      <Field key={field} label={LABELS[field]} testId={`hero-field-${field}`}>
                        <TextInput
                          value={current[field]}
                          disabled={!editable}
                          onChange={(event) =>
                            setContent((state) => ({
                              ...state,
                              [locale]: { ...state[locale], [field]: event.target.value },
                            }))
                          }
                          data-testid={`hero-input-${field}`}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <h3 className="mb-4 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Media & links
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge icon" hint="lucide-react icon name" testId="hero-field-badge-icon">
                <TextInput
                  value={badgeIcon}
                  disabled={!editable}
                  onChange={(event) => setBadgeIcon(event.target.value)}
                  placeholder="Sparkles"
                  data-testid="hero-input-badge-icon"
                />
              </Field>

              <Field label="Profile photo" testId="hero-field-profile">
                <div className="flex items-center gap-3">
                  {profile ? (
                    <span className="relative">
                      <Image
                        src={profile.url}
                        alt={profile.alt_text ?? "Profile"}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProfile(null)}
                        aria-label="Remove profile photo"
                        data-testid="hero-profile-remove"
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-error-500 p-0.5 text-admin-white"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null}
                  <Button
                    variant="secondary"
                    disabled={!editable}
                    onClick={() => setPickerOpen(true)}
                    data-testid="hero-profile-pick-button"
                  >
                    <ImagePlus size={16} />
                    {profile ? "Change" : "Select image"}
                  </Button>
                </div>
              </Field>

              <Field label="Primary button URL" hint="CV file or any link" testId="hero-field-primary-url">
                <TextInput
                  value={primaryUrl}
                  disabled={!editable}
                  onChange={(event) => setPrimaryUrl(event.target.value)}
                  data-testid="hero-input-primary-url"
                />
              </Field>

              <Field label="Secondary button URL" testId="hero-field-secondary-url">
                <TextInput
                  value={secondaryUrl}
                  disabled={!editable}
                  onChange={(event) => setSecondaryUrl(event.target.value)}
                  data-testid="hero-input-secondary-url"
                />
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">
                Section visible on the landing page
              </span>
              <Switch checked={isActive} onChange={setIsActive} label="Active" testId="hero-active-switch" />
            </div>

            {editable ? (
              <div className="mt-5 flex justify-end">
                <Button loading={saving} onClick={() => void saveHero()} data-testid="hero-save-button">
                  <Save size={16} />
                  Save hero section
                </Button>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                  Floating metrics
                </h3>
                <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  The small cards around the profile photo.
                </p>
              </div>

              <Button
                variant={showTrashed ? "primary" : "secondary"}
                onClick={() => setShowTrashed((state) => !state)}
                data-testid="hero-metric-trash-toggle-button"
              >
                <Trash2 size={16} />
                {showTrashed ? "Viewing trash" : "Trash"}
              </Button>

              {can("hero_sections.create") ? (
                <Button onClick={openMetricCreate} data-testid="hero-metric-create-button">
                  <Plus size={16} />
                  New metric
                </Button>
              ) : null}
            </div>

            {metrics.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-12 text-center"
                data-testid="hero-metric-empty-state"
              >
                <Gauge size={26} className="text-admin-gray-400" />
                <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  {showTrashed ? "Trash is empty." : "No metrics yet."}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2" data-testid="hero-metric-list">
                {metrics.map((metric, index) => (
                  <li
                    key={metric.id}
                    data-testid={`hero-metric-row-${metric.id}`}
                    className="flex items-center gap-3 rounded-xl border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800"
                  >
                    {!showTrashed && editable ? (
                      <SortButtons
                        onUp={() => void move(index, -1)}
                        onDown={() => void move(index, 1)}
                        disabledUp={index === 0}
                        disabledDown={index === metrics.length - 1}
                        testIdPrefix={`hero-metric-${metric.id}`}
                      />
                    ) : null}

                    <span
                      className="flex h-9 min-w-12 items-center justify-center rounded-lg px-2 text-xs font-semibold"
                      style={{
                        backgroundColor: `${metric.color_hex ?? "#465fff"}22`,
                        color: metric.color_hex ?? "#465fff",
                      }}
                    >
                      {metric.value}
                    </span>

                    <span className="flex-1">
                      <span className="block text-sm font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {metric.label ?? "—"}
                      </span>
                      <span className="block text-xs text-admin-gray-500 dark:text-admin-gray-400">
                        {metric.value} · {metric.icon_name ?? "no icon"}
                      </span>
                    </span>

                    {showTrashed ? (
                      <StatusBadge tone="neutral">Trashed</StatusBadge>
                    ) : editable ? (
                      <Switch
                        checked={metric.is_active}
                        onChange={() =>
                          void act(`/admin/hero-metrics/${metric.id}/toggle-active`, "PATCH", "Could not update.")
                        }
                        label={`Toggle ${metric.label ?? metric.value}`}
                        testId={`hero-metric-toggle-active-${metric.id}`}
                      />
                    ) : null}

                    {showTrashed ? (
                      <button
                        type="button"
                        onClick={() =>
                          void act(`/admin/hero-metrics/${metric.id}/restore`, "POST", "Could not restore.")
                        }
                        aria-label="Restore metric"
                        data-testid={`hero-metric-restore-button-${metric.id}`}
                        className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                      >
                        <RotateCcw size={15} />
                      </button>
                    ) : editable ? (
                      <button
                        type="button"
                        onClick={() => openMetricEdit(metric)}
                        aria-label="Edit metric"
                        data-testid={`hero-metric-edit-button-${metric.id}`}
                        className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                      >
                        <Pencil size={15} />
                      </button>
                    ) : null}

                    {can("hero_sections.delete") ? (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(metric)}
                        aria-label="Delete metric"
                        data-testid={`hero-metric-delete-button-${metric.id}`}
                        className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-error-500/10 hover:text-error-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Modal
        open={metricModal}
        title={metricId ? "Edit metric" : "New metric"}
        description="A short value with a translated label, for example 98+ / Page Speed."
        onClose={() => setMetricModal(false)}
        size="md"
        testId="hero-metric-form-modal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setMetricModal(false)}
              data-testid="hero-metric-form-cancel-button"
            >
              Cancel
            </Button>
            <Button
              loading={metricSaving}
              onClick={() => void saveMetric()}
              data-testid="hero-metric-form-submit-button"
            >
              {metricId ? "Save changes" : "Create metric"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={metricLocale}
          onChange={setMetricLocale}
          testIdPrefix="hero-metric-"
          completeness={{ id: metricLabels.id.trim() !== "", en: metricLabels.en.trim() !== "" }}
        />

        <div className="flex flex-col gap-4">
          <Field
            label="Label"
            required
            error={metricErrors[`translations.${metricLocale}.label`] ?? metricErrors.translations}
            testId="hero-metric-label-field"
          >
            <TextInput
              value={metricLabels[metricLocale]}
              onChange={(event) =>
                setMetricLabels((state) => ({ ...state, [metricLocale]: event.target.value }))
              }
              placeholder="Page Speed"
              data-testid="hero-metric-label-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Value" required error={metricErrors.value} testId="hero-metric-value-field">
              <TextInput
                value={metricValue}
                hasError={metricErrors.value !== undefined}
                onChange={(event) => setMetricValue(event.target.value)}
                placeholder="98+"
                data-testid="hero-metric-value-input"
              />
            </Field>

            <Field label="Icon name" testId="hero-metric-icon-field">
              <TextInput
                value={metricIcon}
                onChange={(event) => setMetricIcon(event.target.value)}
                placeholder="Zap"
                data-testid="hero-metric-icon-input"
              />
            </Field>
          </div>

          <Field label="Colour" error={metricErrors.color_hex} testId="hero-metric-color-field">
            <div className="flex gap-2">
              <input
                type="color"
                value={metricColor}
                onChange={(event) => setMetricColor(event.target.value)}
                aria-label="Pick metric colour"
                data-testid="hero-metric-color-picker"
                className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
              />
              <TextInput
                value={metricColor}
                hasError={metricErrors.color_hex !== undefined}
                onChange={(event) => setMetricColor(event.target.value)}
                data-testid="hero-metric-color-input"
              />
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={metricActive}
              onChange={setMetricActive}
              label="Active"
              testId="hero-metric-form-active-switch"
            />
          </div>
        </div>
      </Modal>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={profile?.id ?? null}
        onSelect={(item) => {
          setProfile(item);
          setPickerOpen(false);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.label ?? pendingDelete?.value}” will be removed for good.`
            : `“${pendingDelete?.label ?? pendingDelete?.value}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="hero-metric-delete-dialog"
      />

      {hero === null ? null : <span className="hidden" data-testid="hero-id" />}
    </>
  );
}

function cleaned(source?: Partial<HeroContent>): Record<string, string> {
  return Object.fromEntries(Object.entries(source ?? {}).map(([key, value]) => [key, value ?? ""]));
}
