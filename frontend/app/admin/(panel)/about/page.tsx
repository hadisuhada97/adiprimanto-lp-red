"use client";

import { ImagePlus, Loader2, Pencil, Plus, RotateCcw, Save, Sigma, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextArea, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import Modal from "@/app/components/admin/ui/Modal";
import SortButtons from "@/app/components/admin/ui/SortButtons";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import {
  LOCALES,
  type AboutContent,
  type AboutSection,
  type AboutStat,
  type LocaleCode,
  type MediaItem,
} from "@/app/lib/admin/types";

const TEXT_FIELDS: { key: keyof AboutContent; label: string }[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "location", label: "Location" },
  { key: "headline", label: "Headline" },
  { key: "headline_highlight", label: "Highlighted words" },
  { key: "primary_cta_label", label: "Primary button" },
  { key: "secondary_cta_label", label: "Secondary button" },
];

const BIO_FIELDS: { key: keyof AboutContent; label: string }[] = [
  { key: "bio_paragraph_1", label: "Paragraph 1" },
  { key: "bio_paragraph_2", label: "Paragraph 2" },
  { key: "bio_paragraph_3", label: "Paragraph 3" },
];

const ALL_KEYS = [...TEXT_FIELDS, ...BIO_FIELDS].map((field) => field.key);

const EMPTY_CONTENT = Object.fromEntries(ALL_KEYS.map((key) => [key, ""])) as Record<
  keyof AboutContent,
  string
>;

type ContentState = Record<LocaleCode, Record<keyof AboutContent, string>>;

export default function AboutPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [content, setContent] = useState<ContentState>({ id: EMPTY_CONTENT, en: EMPTY_CONTENT });
  const [locale, setLocale] = useState<LocaleCode>("id");
  const [photo, setPhoto] = useState<MediaItem | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [stats, setStats] = useState<AboutStat[]>([]);
  const [showTrashed, setShowTrashed] = useState(false);
  const [statModal, setStatModal] = useState(false);
  const [statId, setStatId] = useState<string | null>(null);
  const [statLocale, setStatLocale] = useState<LocaleCode>("id");
  const [statTranslations, setStatTranslations] = useState<
    Record<LocaleCode, { label: string; sublabel: string }>
  >({ id: { label: "", sublabel: "" }, en: { label: "", sublabel: "" } });
  const [statValue, setStatValue] = useState("");
  const [statIcon, setStatIcon] = useState("");
  const [statActive, setStatActive] = useState(true);
  const [statErrors, setStatErrors] = useState<Record<string, string>>({});
  const [statSaving, setStatSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AboutStat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aboutResponse, statResponse] = await Promise.all([
        apiRequest<AboutSection>("/admin/about", { auth: true }),
        apiRequest<AboutStat[]>(`/admin/about-stats${showTrashed ? "?trashed=1" : ""}`, { auth: true }),
      ]);

      const data = aboutResponse.data;
      setContent({
        id: { ...EMPTY_CONTENT, ...cleaned(data.translations.id) },
        en: { ...EMPTY_CONTENT, ...cleaned(data.translations.en) },
      });
      setPhoto(data.photo ?? null);
      setLat(data.location_lat === null ? "" : String(data.location_lat));
      setLng(data.location_lng === null ? "" : String(data.location_lng));
      setPrimaryUrl(data.primary_cta_url ?? "");
      setSecondaryUrl(data.secondary_cta_url ?? "");
      setIsActive(data.is_active);
      setStats(statResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the about section.");
    } finally {
      setLoading(false);
    }
  }, [showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAbout = async () => {
    setSaving(true);
    setErrors({});
    try {
      const translations = Object.fromEntries(
        LOCALES.map(({ code }) => [
          code,
          Object.fromEntries(ALL_KEYS.map((key) => [key, content[code][key].trim() || null])),
        ]),
      );

      const { message } = await apiRequest("/admin/about", {
        method: "PATCH",
        auth: true,
        body: {
          photo_media_id: photo?.id ?? null,
          location_lat: lat === "" ? null : Number(lat),
          location_lng: lng === "" ? null : Number(lng),
          primary_cta_url: primaryUrl || null,
          secondary_cta_url: secondaryUrl || null,
          is_active: isActive,
          translations,
        },
      });

      toast.success(message);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the about section.");
      }
    } finally {
      setSaving(false);
    }
  };

  const openStatCreate = () => {
    setStatId(null);
    setStatTranslations({ id: { label: "", sublabel: "" }, en: { label: "", sublabel: "" } });
    setStatValue("");
    setStatIcon("");
    setStatActive(true);
    setStatLocale("id");
    setStatErrors({});
    setStatModal(true);
  };

  const openStatEdit = (stat: AboutStat) => {
    setStatId(stat.id);
    setStatTranslations({
      id: {
        label: stat.translations.id?.label ?? "",
        sublabel: stat.translations.id?.sublabel ?? "",
      },
      en: {
        label: stat.translations.en?.label ?? "",
        sublabel: stat.translations.en?.sublabel ?? "",
      },
    });
    setStatValue(stat.value);
    setStatIcon(stat.icon_name ?? "");
    setStatActive(stat.is_active);
    setStatLocale("id");
    setStatErrors({});
    setStatModal(true);
  };

  const saveStat = async () => {
    setStatSaving(true);
    setStatErrors({});

    const translations = Object.fromEntries(
      LOCALES.filter(({ code }) => statTranslations[code].label.trim() !== "").map(({ code }) => [
        code,
        {
          label: statTranslations[code].label.trim(),
          sublabel: statTranslations[code].sublabel.trim() || null,
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

      const { message } = statId
        ? await apiRequest(`/admin/about-stats/${statId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/about-stats", { method: "POST", auth: true, body });

      toast.success(message);
      setStatModal(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setStatErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the stat.");
      }
    } finally {
      setStatSaving(false);
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
    const next = [...stats];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setStats(next);

    try {
      const { message } = await apiRequest("/admin/about-stats/reorder", {
        method: "POST",
        auth: true,
        body: { items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })) },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reorder the stats.");
      await load();
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/about-stats/${pendingDelete.id}/force`
        : `/admin/about-stats/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the stat.");
    } finally {
      setDeleting(false);
    }
  };

  const editable = can("about_sections.update");
  const current = content[locale];

  return (
    <>
      <PageBreadcrumb title="About" trail={[{ label: "Content" }]} />

      {loading ? (
        <div className="flex justify-center py-24" data-testid="about-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-6" data-testid="about-page">
          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <h3 className="mb-1 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              About copy
            </h3>
            <p className="mb-4 text-sm text-admin-gray-500 dark:text-admin-gray-400">
              Heading, location and the three bio paragraphs shown next to your photo.
            </p>

            <LocaleTabs
              active={locale}
              onChange={setLocale}
              completeness={{
                id: content.id.headline.trim() !== "",
                en: content.en.headline.trim() !== "",
              }}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {TEXT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} testId={`about-field-${field.key}`}>
                  <TextInput
                    value={current[field.key]}
                    disabled={!editable}
                    onChange={(event) =>
                      setContent((state) => ({
                        ...state,
                        [locale]: { ...state[locale], [field.key]: event.target.value },
                      }))
                    }
                    data-testid={`about-input-${field.key}`}
                  />
                </Field>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {BIO_FIELDS.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  error={errors[`translations.${locale}.${field.key}`]}
                  testId={`about-field-${field.key}`}
                >
                  <TextArea
                    rows={3}
                    value={current[field.key]}
                    disabled={!editable}
                    onChange={(event) =>
                      setContent((state) => ({
                        ...state,
                        [locale]: { ...state[locale], [field.key]: event.target.value },
                      }))
                    }
                    data-testid={`about-input-${field.key}`}
                  />
                </Field>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <h3 className="mb-4 text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Photo, map & links
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Photo" testId="about-field-photo">
                <div className="flex items-center gap-3">
                  {photo ? (
                    <span className="relative">
                      <Image
                        src={photo.url}
                        alt={photo.alt_text ?? "About photo"}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        aria-label="Remove photo"
                        data-testid="about-photo-remove"
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
                    data-testid="about-photo-pick-button"
                  >
                    <ImagePlus size={16} />
                    {photo ? "Change" : "Select image"}
                  </Button>
                </div>
              </Field>

              <Field label="Primary button URL" testId="about-field-primary-url">
                <TextInput
                  value={primaryUrl}
                  disabled={!editable}
                  onChange={(event) => setPrimaryUrl(event.target.value)}
                  placeholder="#contact"
                  data-testid="about-input-primary-url"
                />
              </Field>

              <Field label="Latitude" error={errors.location_lat} testId="about-field-lat">
                <TextInput
                  value={lat}
                  disabled={!editable}
                  hasError={errors.location_lat !== undefined}
                  onChange={(event) => setLat(event.target.value)}
                  placeholder="-7.7955798"
                  data-testid="about-input-lat"
                />
              </Field>

              <Field label="Longitude" error={errors.location_lng} testId="about-field-lng">
                <TextInput
                  value={lng}
                  disabled={!editable}
                  hasError={errors.location_lng !== undefined}
                  onChange={(event) => setLng(event.target.value)}
                  placeholder="110.3694896"
                  data-testid="about-input-lng"
                />
              </Field>

              <Field label="Secondary button URL" testId="about-field-secondary-url">
                <TextInput
                  value={secondaryUrl}
                  disabled={!editable}
                  onChange={(event) => setSecondaryUrl(event.target.value)}
                  placeholder="#portfolio"
                  data-testid="about-input-secondary-url"
                />
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">
                Section visible on the landing page
              </span>
              <Switch checked={isActive} onChange={setIsActive} label="Active" testId="about-active-switch" />
            </div>

            {editable ? (
              <div className="mt-5 flex justify-end">
                <Button loading={saving} onClick={() => void saveAbout()} data-testid="about-save-button">
                  <Save size={16} />
                  Save about section
                </Button>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                  About stats
                </h3>
                <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  The three numbers above your bio.
                </p>
              </div>

              <Button
                variant={showTrashed ? "primary" : "secondary"}
                onClick={() => setShowTrashed((state) => !state)}
                data-testid="about-stat-trash-toggle-button"
              >
                <Trash2 size={16} />
                {showTrashed ? "Viewing trash" : "Trash"}
              </Button>

              {can("about_sections.create") ? (
                <Button onClick={openStatCreate} data-testid="about-stat-create-button">
                  <Plus size={16} />
                  New stat
                </Button>
              ) : null}
            </div>

            {stats.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-12 text-center"
                data-testid="about-stat-empty-state"
              >
                <Sigma size={26} className="text-admin-gray-400" />
                <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">
                  {showTrashed ? "Trash is empty." : "No stats yet."}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2" data-testid="about-stat-list">
                {stats.map((stat, index) => (
                  <li
                    key={stat.id}
                    data-testid={`about-stat-row-${stat.id}`}
                    className="flex items-center gap-3 rounded-xl border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800"
                  >
                    {!showTrashed && editable ? (
                      <SortButtons
                        onUp={() => void move(index, -1)}
                        onDown={() => void move(index, 1)}
                        disabledUp={index === 0}
                        disabledDown={index === stats.length - 1}
                        testIdPrefix={`about-stat-${stat.id}`}
                      />
                    ) : null}

                    <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-semibold text-brand-500">
                      {stat.value}
                    </span>

                    <span className="flex-1">
                      <span className="block text-sm font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {stat.label ?? "—"}
                      </span>
                      <span className="block text-xs text-admin-gray-500 dark:text-admin-gray-400">
                        {stat.sublabel ?? "—"}
                      </span>
                    </span>

                    {showTrashed ? (
                      <StatusBadge tone="neutral">Trashed</StatusBadge>
                    ) : editable ? (
                      <Switch
                        checked={stat.is_active}
                        onChange={() =>
                          void act(`/admin/about-stats/${stat.id}/toggle-active`, "PATCH", "Could not update.")
                        }
                        label={`Toggle ${stat.label ?? stat.value}`}
                        testId={`about-stat-toggle-active-${stat.id}`}
                      />
                    ) : null}

                    {showTrashed ? (
                      <button
                        type="button"
                        onClick={() =>
                          void act(`/admin/about-stats/${stat.id}/restore`, "POST", "Could not restore.")
                        }
                        aria-label="Restore stat"
                        data-testid={`about-stat-restore-button-${stat.id}`}
                        className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                      >
                        <RotateCcw size={15} />
                      </button>
                    ) : editable ? (
                      <button
                        type="button"
                        onClick={() => openStatEdit(stat)}
                        aria-label="Edit stat"
                        data-testid={`about-stat-edit-button-${stat.id}`}
                        className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                      >
                        <Pencil size={15} />
                      </button>
                    ) : null}

                    {can("about_sections.delete") ? (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(stat)}
                        aria-label="Delete stat"
                        data-testid={`about-stat-delete-button-${stat.id}`}
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
        open={statModal}
        title={statId ? "Edit stat" : "New stat"}
        description="A number with a translated label and an optional sublabel."
        onClose={() => setStatModal(false)}
        size="md"
        testId="about-stat-form-modal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setStatModal(false)}
              data-testid="about-stat-form-cancel-button"
            >
              Cancel
            </Button>
            <Button
              loading={statSaving}
              onClick={() => void saveStat()}
              data-testid="about-stat-form-submit-button"
            >
              {statId ? "Save changes" : "Create stat"}
            </Button>
          </>
        }
      >
        <LocaleTabs
          active={statLocale}
          onChange={setStatLocale}
          testIdPrefix="about-stat-"
          completeness={{
            id: statTranslations.id.label.trim() !== "",
            en: statTranslations.en.label.trim() !== "",
          }}
        />

        <div className="flex flex-col gap-4">
          <Field
            label="Label"
            required
            error={statErrors[`translations.${statLocale}.label`] ?? statErrors.translations}
            testId="about-stat-label-field"
          >
            <TextInput
              value={statTranslations[statLocale].label}
              onChange={(event) =>
                setStatTranslations((state) => ({
                  ...state,
                  [statLocale]: { ...state[statLocale], label: event.target.value },
                }))
              }
              placeholder="Tahun Pengalaman"
              data-testid="about-stat-label-input"
            />
          </Field>

          <Field label="Sublabel" testId="about-stat-sublabel-field">
            <TextInput
              value={statTranslations[statLocale].sublabel}
              onChange={(event) =>
                setStatTranslations((state) => ({
                  ...state,
                  [statLocale]: { ...state[statLocale], sublabel: event.target.value },
                }))
              }
              placeholder="since 2020"
              data-testid="about-stat-sublabel-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Value" required error={statErrors.value} testId="about-stat-value-field">
              <TextInput
                value={statValue}
                hasError={statErrors.value !== undefined}
                onChange={(event) => setStatValue(event.target.value)}
                placeholder="5+"
                data-testid="about-stat-value-input"
              />
            </Field>

            <Field label="Icon name" testId="about-stat-icon-field">
              <TextInput
                value={statIcon}
                onChange={(event) => setStatIcon(event.target.value)}
                placeholder="CalendarDays"
                data-testid="about-stat-icon-input"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
            <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
            <Switch
              checked={statActive}
              onChange={setStatActive}
              label="Active"
              testId="about-stat-form-active-switch"
            />
          </div>
        </div>
      </Modal>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={photo?.id ?? null}
        onSelect={(item) => {
          setPhoto(item);
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
        testId="about-stat-delete-dialog"
      />
    </>
  );
}

function cleaned(source?: Partial<AboutContent>): Record<string, string> {
  return Object.fromEntries(Object.entries(source ?? {}).map(([key, value]) => [key, value ?? ""]));
}
