"use client";

import { ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import MediaPicker from "@/app/components/admin/MediaPicker";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import { Field, Select, Switch, TextInput } from "@/app/components/admin/ui/Form";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import type { MediaItem, SettingItem, SettingsPayload } from "@/app/lib/admin/types";

const GROUP_TITLES: Record<string, { title: string; description: string }> = {
  general: { title: "General", description: "Brand identity and the contact details used across the site." },
  appearance: { title: "Appearance", description: "Colours and the switchers shown to visitors." },
  integration: { title: "Integrations", description: "Contact form behaviour and notification target." },
};

const LABELS: Record<string, string> = {
  brand_name: "Brand name",
  brand_tagline: "Tagline",
  whatsapp_number: "WhatsApp number",
  contact_email: "Contact email",
  location: "Location",
  opening_hours: "Opening hours",
  default_locale: "Default language",
  default_theme: "Default theme",
  cv_file_path: "CV file path",
  base_url: "Base URL",
  logo_media_id: "Logo",
  favicon_media_id: "Favicon",
  primary_color: "Primary colour",
  is_language_switcher_enabled: "Language switcher",
  is_theme_switcher_enabled: "Theme switcher",
  is_contact_form_enabled: "Contact form",
  contact_notification_email: "Lead notification email",
};

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  default_locale: [
    { value: "id", label: "Indonesian" },
    { value: "en", label: "English" },
  ],
  default_theme: [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
  ],
};

type Values = Record<string, string | boolean | null>;

function referenceOf(setting: SettingItem): string {
  return `${setting.group}.${setting.key}`;
}

export default function GeneralSettingsPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [values, setValues] = useState<Values>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiRequest<SettingsPayload>("/admin/settings", { auth: true });
      setSettings(data.items);
      setMedia(data.media);
      setValues(
        Object.fromEntries(
          data.items.map((setting) => [
            referenceOf(setting),
            setting.type === "boolean"
              ? Boolean(setting.value)
              : setting.value === null
                ? null
                : String(setting.value),
          ]),
        ),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the settings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, SettingItem[]>();
    settings.forEach((setting) => {
      map.set(setting.group, [...(map.get(setting.group) ?? []), setting]);
    });

    const order = ["general", "appearance", "integration"];

    return [...map.entries()].sort(
      ([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
    );
  }, [settings]);

  const mediaFor = (id: string | boolean | null): MediaItem | undefined =>
    typeof id === "string" ? media.find((item) => item.id === id) : undefined;

  const save = async () => {
    setSaving(true);
    try {
      const items = settings.map((setting) => ({
        group: setting.group,
        key: setting.key,
        value: values[referenceOf(setting)] ?? null,
      }));

      const { message } = await apiRequest("/admin/settings", {
        method: "PATCH",
        auth: true,
        body: { items },
      });

      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the settings.");
    } finally {
      setSaving(false);
    }
  };

  const editable = can("settings.update");

  return (
    <>
      <PageBreadcrumb title="General" trail={[{ label: "Settings" }]} />

      {loading ? (
        <div className="flex justify-center py-24" data-testid="settings-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-6" data-testid="settings-page">
          {groups.map(([group, items]) => (
            <section
              key={group}
              data-testid={`settings-group-${group}`}
              className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900"
            >
              <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                {GROUP_TITLES[group]?.title ?? group}
              </h3>
              <p className="mt-1 mb-6 text-sm text-admin-gray-500 dark:text-admin-gray-400">
                {GROUP_TITLES[group]?.description ?? ""}
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                {items.map((setting) => {
                  const reference = referenceOf(setting);
                  const label = LABELS[setting.key] ?? setting.key;
                  const value = values[reference];

                  if (setting.type === "boolean") {
                    return (
                      <div
                        key={reference}
                        className="flex items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800"
                        data-testid={`setting-field-${setting.key}`}
                      >
                        <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">{label}</span>
                        <Switch
                          checked={value === true}
                          onChange={(next) =>
                            editable && setValues((current) => ({ ...current, [reference]: next }))
                          }
                          label={label}
                          testId={`setting-switch-${setting.key}`}
                        />
                      </div>
                    );
                  }

                  if (setting.type === "media") {
                    const selected = mediaFor(value);

                    return (
                      <Field key={reference} label={label} testId={`setting-field-${setting.key}`}>
                        <div className="flex items-center gap-3">
                          {selected ? (
                            <span className="relative">
                              <Image
                                src={selected.url}
                                alt={selected.alt_text ?? label}
                                width={56}
                                height={56}
                                unoptimized
                                className="h-14 w-14 rounded-lg object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setValues((current) => ({ ...current, [reference]: null }))}
                                aria-label={`Remove ${label}`}
                                data-testid={`setting-media-remove-${setting.key}`}
                                className="absolute -top-1.5 -right-1.5 rounded-full bg-error-500 p-0.5 text-admin-white"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ) : null}
                          <Button
                            variant="secondary"
                            disabled={!editable}
                            onClick={() => setPickerKey(reference)}
                            data-testid={`setting-media-pick-${setting.key}`}
                          >
                            <ImagePlus size={16} />
                            {selected ? "Change" : "Select image"}
                          </Button>
                        </div>
                      </Field>
                    );
                  }

                  if (SELECT_OPTIONS[setting.key] !== undefined) {
                    return (
                      <Field key={reference} label={label} testId={`setting-field-${setting.key}`}>
                        <Select
                          value={typeof value === "string" ? value : ""}
                          disabled={!editable}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [reference]: event.target.value }))
                          }
                          data-testid={`setting-select-${setting.key}`}
                        >
                          {SELECT_OPTIONS[setting.key].map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    );
                  }

                  if (setting.key.endsWith("_color")) {
                    return (
                      <Field key={reference} label={label} testId={`setting-field-${setting.key}`}>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={typeof value === "string" ? value : "#ef4444"}
                            disabled={!editable}
                            onChange={(event) =>
                              setValues((current) => ({ ...current, [reference]: event.target.value }))
                            }
                            aria-label={`Pick ${label}`}
                            data-testid={`setting-color-picker-${setting.key}`}
                            className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-admin-gray-300 bg-transparent dark:border-admin-gray-700"
                          />
                          <TextInput
                            value={typeof value === "string" ? value : ""}
                            disabled={!editable}
                            onChange={(event) =>
                              setValues((current) => ({ ...current, [reference]: event.target.value }))
                            }
                            data-testid={`setting-input-${setting.key}`}
                          />
                        </div>
                      </Field>
                    );
                  }

                  return (
                    <Field key={reference} label={label} testId={`setting-field-${setting.key}`}>
                      <TextInput
                        value={typeof value === "string" ? value : ""}
                        disabled={!editable}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [reference]: event.target.value }))
                        }
                        data-testid={`setting-input-${setting.key}`}
                      />
                    </Field>
                  );
                })}
              </div>
            </section>
          ))}

          {editable ? (
            <div className="flex justify-end">
              <Button loading={saving} onClick={() => void save()} data-testid="settings-save-button">
                <Save size={16} />
                Save settings
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <MediaPicker
        open={pickerKey !== null}
        onClose={() => setPickerKey(null)}
        selectedId={pickerKey === null ? null : (values[pickerKey] as string | null)}
        onSelect={(item) => {
          setMedia((current) =>
            current.some((existing) => existing.id === item.id) ? current : [...current, item],
          );
          if (pickerKey !== null) setValues((current) => ({ ...current, [pickerKey]: item.id }));
          setPickerKey(null);
        }}
      />
    </>
  );
}
