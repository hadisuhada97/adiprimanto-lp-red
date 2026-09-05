// Server-side SEO + settings fetchers used by generateMetadata, sitemap and robots.
import { cache } from "react";
import type { ApiMedia } from "./public";
import type { NavItem, PublicSettings } from "./landing";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export type SeoEntry = {
  id: string;
  page_key: string;
  robots_directive: string | null;
  structured_data: Record<string, unknown> | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: ApiMedia | null;
};

async function getJson<T>(path: string, tag: string): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600, tags: [tag] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export function fetchSeoAll(locale = "id"): Promise<SeoEntry[] | null> {
  return getJson<SeoEntry[]>(`/public/seo?locale=${locale}`, "seo");
}

export const fetchSeoEntry = cache(
  async (pageKey: string, locale = "id"): Promise<SeoEntry | null> => {
    const data = await getJson<SeoEntry | SeoEntry[]>(
      `/public/seo?page_key=${pageKey}&locale=${locale}`,
      "seo",
    );

    if (!data) return null;
    if (Array.isArray(data)) {
      return data.find((entry) => entry.page_key === pageKey) ?? null;
    }
    return data;
  },
);

export const fetchSettings = cache(
  (locale = "id"): Promise<PublicSettings | null> =>
    getJson<PublicSettings>(`/public/settings?locale=${locale}`, "settings"),
);

export const fetchNavigation = cache(
  (
    locale = "id",
  ): Promise<{ header: NavItem[]; footer: NavItem[] } | null> =>
    getJson<{ header: NavItem[]; footer: NavItem[] }>(
      `/public/navigation?locale=${locale}`,
      "navigation",
    ),
);
