"use client";

import { ArrowLeft, ImagePlus, Loader2, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
import Button from "@/app/components/admin/ui/Button";
import { Field, Select, Switch, TextArea, TextInput } from "@/app/components/admin/ui/Form";
import LocaleTabs from "@/app/components/admin/ui/LocaleTabs";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";
import {
  LOCALES,
  slugify,
  type LocaleCode,
  type MediaItem,
  type Project,
  type ProjectCategory,
  type Technology,
} from "@/app/lib/admin/types";

type TranslationState = Record<LocaleCode, { title: string; description: string; content: string }>;

const EMPTY_TRANSLATIONS: TranslationState = {
  id: { title: "", description: "", content: "" },
  en: { title: "", description: "", content: "" },
};

export default function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const toast = useToast();

  const [locale, setLocale] = useState<LocaleCode>("id");
  const [translations, setTranslations] = useState<TranslationState>(() => {
    if (project === undefined) return EMPTY_TRANSLATIONS;

    return {
      id: {
        title: project.translations.id?.title ?? "",
        description: project.translations.id?.description ?? "",
        content: project.translations.id?.content ?? "",
      },
      en: {
        title: project.translations.en?.title ?? "",
        description: project.translations.en?.description ?? "",
        content: project.translations.en?.content ?? "",
      },
    };
  });

  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(project !== undefined);
  const [categoryId, setCategoryId] = useState(project?.project_category_id ?? "");
  const [technologyIds, setTechnologyIds] = useState<string[]>(project?.technology_ids ?? []);
  const [cover, setCover] = useState<MediaItem | null>(project?.cover ?? null);
  const [demoUrl, setDemoUrl] = useState(project?.demo_url ?? "");
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? "");
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [year, setYear] = useState(project?.year ? String(project.year) : "");
  const [status, setStatus] = useState<"draft" | "published">(project?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(project?.is_featured ?? false);
  const [isActive, setIsActive] = useState(project?.is_active ?? true);

  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [categoryResponse, technologyResponse] = await Promise.all([
        apiRequest<ProjectCategory[]>("/admin/project-categories", { auth: true }),
        apiRequest<Technology[]>("/admin/technologies", { auth: true }),
      ]);

      setCategories(categoryResponse.data);
      setTechnologies(technologyResponse.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load form options.");
    }
  }, [toast]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!dirty) return;

    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", guard);

    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const submit = async (publish: boolean) => {
    setSaving(true);
    setErrors({});

    const payload = Object.fromEntries(
      LOCALES.filter(({ code }) => translations[code].title.trim() !== "").map(({ code }) => [
        code,
        {
          title: translations[code].title.trim(),
          description: translations[code].description.trim() || null,
          content: translations[code].content.trim() || null,
        },
      ]),
    );

    const nextStatus = publish ? "published" : status;

    try {
      const body = {
        slug: slug || slugify(translations.id.title || translations.en.title),
        project_category_id: categoryId || null,
        cover_media_id: cover?.id ?? null,
        demo_url: demoUrl || null,
        github_url: githubUrl || null,
        client_name: clientName || null,
        year: year ? Number(year) : null,
        status: nextStatus,
        published_at:
          nextStatus === "published"
            ? (project?.published_at ?? new Date().toISOString())
            : null,
        is_featured: isFeatured,
        is_active: isActive,
        technology_ids: technologyIds,
        translations: payload,
      };

      const { data, message } = project
        ? await apiRequest<Project>(`/admin/projects/${project.id}`, {
            method: "PATCH",
            auth: true,
            body,
          })
        : await apiRequest<Project>("/admin/projects", { method: "POST", auth: true, body });

      toast.success(message);
      setDirty(false);

      if (project) {
        setStatus(data.status);
      } else {
        router.push(`/admin/portfolio/projects/${data.id}`);
        return;
      }
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the project.");
      }
    } finally {
      setSaving(false);
    }
  };

  const titleError = errors[`translations.${locale}.title`] ?? errors.translations;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/portfolio/projects"
          data-testid="project-form-back-link"
          className="inline-flex items-center gap-2 text-sm font-medium text-admin-gray-500 transition-colors hover:text-brand-500 dark:text-admin-gray-400"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            loading={saving}
            onClick={() => void submit(false)}
            data-testid="project-form-save-button"
          >
            <Save size={16} />
            Save
          </Button>
          <Button loading={saving} onClick={() => void submit(true)} data-testid="project-form-publish-button">
            Save &amp; publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <LocaleTabs
              active={locale}
              onChange={setLocale}
              completeness={{
                id: translations.id.title.trim() !== "",
                en: translations.en.title.trim() !== "",
              }}
            />

            <div className="flex flex-col gap-4">
              <Field
                label={`Title (${locale.toUpperCase()})`}
                required
                error={titleError}
                testId="project-title-field"
              >
                <TextInput
                  value={translations[locale].title}
                  hasError={titleError !== undefined}
                  onChange={(event) => {
                    const value = event.target.value;
                    markDirty();
                    setTranslations((current) => ({
                      ...current,
                      [locale]: { ...current[locale], title: value },
                    }));
                    if (!slugTouched && locale === "id") setSlug(slugify(value));
                  }}
                  placeholder="Website Jual Beli Kendaraan"
                  data-testid="project-title-input"
                />
              </Field>

              <Field
                label={`Short description (${locale.toUpperCase()})`}
                error={errors[`translations.${locale}.description`]}
                hint="Shown on the portfolio card. Keep it under two sentences."
                testId="project-description-field"
              >
                <TextArea
                  rows={3}
                  value={translations[locale].description}
                  onChange={(event) => {
                    const value = event.target.value;
                    markDirty();
                    setTranslations((current) => ({
                      ...current,
                      [locale]: { ...current[locale], description: value },
                    }));
                  }}
                  placeholder="Marketplace kendaraan dengan pencarian cepat."
                  data-testid="project-description-input"
                />
              </Field>

              <Field
                label={`Case study (${locale.toUpperCase()})`}
                error={errors[`translations.${locale}.content`]}
                hint="Optional long-form content for the project detail page."
                testId="project-content-field"
              >
                <TextArea
                  rows={8}
                  value={translations[locale].content}
                  onChange={(event) => {
                    const value = event.target.value;
                    markDirty();
                    setTranslations((current) => ({
                      ...current,
                      [locale]: { ...current[locale], content: value },
                    }));
                  }}
                  data-testid="project-content-input"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <p className="mb-4 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Links &amp; client
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Demo URL" error={errors.demo_url} testId="project-demo-url-field">
                <TextInput
                  value={demoUrl}
                  hasError={errors.demo_url !== undefined}
                  onChange={(event) => {
                    markDirty();
                    setDemoUrl(event.target.value);
                  }}
                  placeholder="https://sentraoto.com"
                  data-testid="project-demo-url-input"
                />
              </Field>

              <Field label="GitHub URL" error={errors.github_url} testId="project-github-url-field">
                <TextInput
                  value={githubUrl}
                  hasError={errors.github_url !== undefined}
                  onChange={(event) => {
                    markDirty();
                    setGithubUrl(event.target.value);
                  }}
                  placeholder="https://github.com/…"
                  data-testid="project-github-url-input"
                />
              </Field>

              <Field label="Client" error={errors.client_name} testId="project-client-field">
                <TextInput
                  value={clientName}
                  onChange={(event) => {
                    markDirty();
                    setClientName(event.target.value);
                  }}
                  placeholder="Sentraoto"
                  data-testid="project-client-input"
                />
              </Field>

              <Field label="Year" error={errors.year} testId="project-year-field">
                <TextInput
                  type="number"
                  value={year}
                  hasError={errors.year !== undefined}
                  onChange={(event) => {
                    markDirty();
                    setYear(event.target.value);
                  }}
                  placeholder="2025"
                  data-testid="project-year-input"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <p className="mb-4 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Publishing
            </p>

            <div className="flex flex-col gap-4">
              <Field label="Status" error={errors.status} testId="project-status-field">
                <Select
                  value={status}
                  onChange={(event) => {
                    markDirty();
                    setStatus(event.target.value as "draft" | "published");
                  }}
                  data-testid="project-status-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </Field>

              <Field label="Slug" required error={errors.slug} testId="project-slug-field">
                <TextInput
                  value={slug}
                  hasError={errors.slug !== undefined}
                  onChange={(event) => {
                    markDirty();
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                  placeholder="sentraoto-marketplace"
                  data-testid="project-slug-input"
                />
              </Field>

              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Featured</span>
                <Switch
                  checked={isFeatured}
                  onChange={(next) => {
                    markDirty();
                    setIsFeatured(next);
                  }}
                  label="Featured"
                  testId="project-featured-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
                <Switch
                  checked={isActive}
                  onChange={(next) => {
                    markDirty();
                    setIsActive(next);
                  }}
                  label="Active"
                  testId="project-active-switch"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <p className="mb-4 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Cover image
            </p>

            {cover ? (
              <div className="relative overflow-hidden rounded-xl border border-admin-gray-200 dark:border-admin-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.url}
                  alt={cover.alt_text ?? cover.original_name}
                  className="aspect-4/3 w-full object-cover"
                  data-testid="project-cover-preview"
                />
                <button
                  type="button"
                  onClick={() => {
                    markDirty();
                    setCover(null);
                  }}
                  aria-label="Remove cover image"
                  data-testid="project-cover-remove-button"
                  className="absolute top-2 right-2 rounded-lg bg-admin-white p-1.5 text-error-500 shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                data-testid="project-cover-pick-button"
                className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-admin-gray-300 text-admin-gray-400 transition-colors hover:border-brand-500 hover:text-brand-500 dark:border-admin-gray-700"
              >
                <ImagePlus size={22} />
                <span className="text-xs font-medium">Choose from library</span>
              </button>
            )}

            {cover ? (
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => setPickerOpen(true)}
                data-testid="project-cover-change-button"
              >
                Change image
              </Button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
            <p className="mb-4 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
              Classification
            </p>

            <Field label="Category" error={errors.project_category_id} testId="project-category-field">
              <Select
                value={categoryId}
                onChange={(event) => {
                  markDirty();
                  setCategoryId(event.target.value);
                }}
                data-testid="project-category-select"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.translations.id?.name ?? category.slug}
                  </option>
                ))}
              </Select>
            </Field>

            <p className="mt-5 mb-2 text-sm font-medium text-admin-gray-700 dark:text-admin-gray-300">
              Technologies
            </p>
            {technologies.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-admin-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Loading technologies
              </p>
            ) : (
              <div className="flex flex-wrap gap-2" data-testid="project-technology-list">
                {technologies.map((technology) => {
                  const selected = technologyIds.includes(technology.id);

                  return (
                    <button
                      key={technology.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        markDirty();
                        setTechnologyIds((current) =>
                          selected
                            ? current.filter((id) => id !== technology.id)
                            : [...current, technology.id],
                        );
                      }}
                      data-testid={`project-technology-chip-${technology.slug}`}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300"
                          : "border-admin-gray-300 text-admin-gray-600 hover:border-brand-400 dark:border-admin-gray-700 dark:text-admin-gray-300"
                      }`}
                    >
                      {technology.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={cover?.id ?? null}
        onSelect={(media) => {
          markDirty();
          setCover(media);
        }}
      />
    </>
  );
}
