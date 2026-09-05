// Typed client for the public CMS API (Laravel). Replaces the removed Supabase client.
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL; // already includes /api/v1

export type ApiMedia = {
  id: string;
  url: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
};

export type ApiTechnology = {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  color_hex: string | null;
};

export type ApiProjectCategory = {
  id: string;
  slug: string;
  name: string;
  color_hex: string | null;
};

export type ApiProject = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: ApiProjectCategory | null;
  cover: ApiMedia | null;
  technologies: ApiTechnology[];
  demo_url: string | null;
  github_url: string | null;
  client_name: string | null;
  year: number | null;
  is_featured: boolean;
};

export type PublicCategory = ApiProjectCategory & { projects_count: number };

async function getJson<T>(path: string, locale: string): Promise<T> {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}locale=${locale}`, {
    headers: { Accept: "application/json" },
    // Cache on the server; landing content is revalidated on demand.
    next: { revalidate: 3600, tags: ["projects"] },
  });
  if (!res.ok) throw new Error(`Public API ${path} responded ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

export function fetchProjects(locale: string): Promise<ApiProject[]> {
  return getJson<ApiProject[]>("/public/projects?per_page=100", locale);
}

export function fetchProjectCategories(locale: string): Promise<PublicCategory[]> {
  return getJson<PublicCategory[]>("/public/project-categories", locale);
}
