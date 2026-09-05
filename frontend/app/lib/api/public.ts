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

export type ContactMessagePayload = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  website?: string; // honeypot — must stay empty
};

export type ContactMessageResult =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: Record<string, string[]> };

export async function submitContactMessage(
  payload: ContactMessagePayload,
  locale = "id",
): Promise<ContactMessageResult> {
  if (!BASE) return { ok: false, message: "API is not configured." };

  try {
    const res = await fetch(`${BASE}/public/contact-messages?locale=${locale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        message: json?.message ?? `Request failed (${res.status}).`,
        errors: json?.errors,
      };
    }

    return { ok: true, message: json?.message ?? "Your message has been sent." };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

