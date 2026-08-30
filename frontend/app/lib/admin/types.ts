export type LocaleCode = "id" | "en";

export const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "id", label: "Indonesian" },
  { code: "en", label: "English" },
];

export type MediaItem = {
  id: string;
  url: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string | null;
};

export type Technology = {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  color_hex: string | null;
  is_active: boolean;
  sort_order: number;
  projects_count?: number;
};

export type ProjectCategory = {
  id: string;
  slug: string;
  color_hex: string | null;
  is_active: boolean;
  sort_order: number;
  name: string | null;
  translations: Partial<Record<LocaleCode, { name: string }>>;
  projects_count?: number;
};

export type Project = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  content: string | null;
  translations: Partial<Record<LocaleCode, { title: string; description: string | null; content: string | null }>>;
  project_category_id: string | null;
  category?: { id: string | null; slug: string | null; name: string | null; color_hex: string | null } | null;
  cover_media_id: string | null;
  cover?: MediaItem | null;
  technology_ids?: string[];
  technologies?: Technology[];
  demo_url: string | null;
  github_url: string | null;
  client_name: string | null;
  year: number | null;
  is_featured: boolean;
  is_active: boolean;
  status: "draft" | "published";
  published_at: string | null;
  sort_order: number;
  deleted_at: string | null;
  updated_at: string | null;
};

export type TestimonialTranslation = {
  name: string;
  role: string | null;
  company: string | null;
  project_label: string | null;
  feedback: string;
};

export type Testimonial = {
  id: string;
  name: string | null;
  role: string | null;
  company: string | null;
  project_label: string | null;
  feedback: string | null;
  translations: Partial<Record<LocaleCode, TestimonialTranslation>>;
  rating: number;
  accent_color: string | null;
  source: "whatsapp" | "email" | "manual";
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  avatar_media_id: string | null;
  avatar?: MediaItem | null;
  screenshot_media_id: string | null;
  screenshot?: MediaItem | null;
  deleted_at: string | null;
};

export type Service = {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[];
  translations: Partial<Record<LocaleCode, { title: string; description: string | null; tags: string[] }>>;
  icon_name: string | null;
  price_from: number | null;
  price_currency: string | null;
  duration_days: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
};

export type ServiceStat = {
  id: string;
  value: string;
  icon_name: string | null;
  unit: string | null;
  label: string | null;
  translations: Partial<Record<LocaleCode, { unit: string | null; label: string | null }>>;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
};

export type FaqCategory = {
  id: string;
  slug: string;
  name: string | null;
  translations: Partial<Record<LocaleCode, { name: string }>>;
  is_active: boolean;
  sort_order: number;
  faqs_count?: number;
  deleted_at: string | null;
};

export type Faq = {
  id: string;
  question: string | null;
  answer: string | null;
  translations: Partial<Record<LocaleCode, { question: string; answer: string }>>;
  faq_category_id: string | null;
  category?: { id: string; slug: string; name: string | null } | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
};

export type SettingItem = {
  id: string;
  group: string;
  key: string;
  value: string | number | boolean | null;
  type: string;
  is_public: boolean;
  sort_order: number;
};

export type SettingsPayload = {
  items: SettingItem[];
  media: MediaItem[];
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
