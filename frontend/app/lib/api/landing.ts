// Aggregate landing-page content from the CMS public API.
import type { ApiMedia } from "./public";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export type HeroContent = {
  badge: string;
  role: string;
  headline_line_1: string;
  headline_highlight: string;
  headline_stroke: string;
  description_prefix: string;
  description_strong: string;
  description_suffix: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  trusted_prefix: string;
  trusted_strong: string;
  trusted_suffix: string;
};

export type HeroMetric = {
  id: string;
  value: string;
  icon_name: string | null;
  color_hex: string | null;
  label: string;
};

export type AboutContent = {
  eyebrow: string;
  location: string;
  headline: string;
  headline_highlight: string;
  bio_paragraph_1: string;
  bio_paragraph_2: string;
  bio_paragraph_3: string;
  primary_cta_label: string;
  secondary_cta_label: string;
};

export type AboutStat = {
  id: string;
  value: string;
  icon_name: string | null;
  label: string;
  sublabel: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon_name: string | null;
};

export type ServiceStat = {
  id: string;
  value: string;
  icon_name: string | null;
  unit: string;
  label: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string | null;
  project_label: string | null;
  feedback: string;
  rating: number;
  accent_color: string | null;
  avatar: ApiMedia | null;
  screenshot: ApiMedia | null;
};

export type Faq = { id: string; question: string; answer: string };

export type SkillCategory = {
  id: string;
  name: string;
  eyebrow: string | null;
  icon_name: string | null;
  skills: {
    id: string;
    name: string;
    icon_name: string | null;
    color_hex: string | null;
  }[];
};

export type PainPoint = {
  id: string;
  title: string;
  description: string;
  icon_name: string | null;
};

export type ProcessStep = {
  id: string;
  title: string;
  description: string;
  icon_name: string | null;
};

export type Client = {
  id: string;
  name: string;
  icon_name: string | null;
  font_class: string | null;
  logo: ApiMedia | null;
};

export type NavItem = {
  id: string;
  location: string;
  url: string | null;
  anchor: string | null;
  target: string | null;
  label: string;
  children?: NavItem[];
};

export type ContactChannel = {
  id: string;
  type: string;
  value: string;
  url: string | null;
  icon_name: string | null;
  color_hex: string | null;
  label: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  icon_name: string | null;
  color_hex: string | null;
};

export type PublicSettings = {
  general?: {
    brand_name?: string | null;
    brand_tagline?: string | null;
    whatsapp_number?: string | null;
    contact_email?: string | null;
    location?: string | null;
    base_url?: string | null;
    logo_media_id?: string | null;
    favicon_media_id?: string | null;
    [key: string]: string | null | undefined;
  };
  appearance?: {
    primary_color?: string | null;
    is_language_switcher_enabled?: boolean | null;
    is_theme_switcher_enabled?: boolean | null;
    [key: string]: string | boolean | null | undefined;
  };
};

export type LandingData = {
  hero: {
    hero:
      | {
          content: HeroContent;
          badge_icon: string | null;
          primary_cta_url: string | null;
          secondary_cta_url: string | null;
          profile: ApiMedia | null;
          cv: ApiMedia | null;
        }
      | null;
    metrics: HeroMetric[];
  };
  about: {
    about:
      | {
          content: AboutContent;
          primary_cta_url: string | null;
          secondary_cta_url: string | null;
          photo: ApiMedia | null;
        }
      | null;
    stats: AboutStat[];
  };
  services: { services: Service[]; stats: ServiceStat[] };
  testimonials: Testimonial[];
  faqs: { faqs: Faq[] };
  skills: SkillCategory[];
  pain_points: PainPoint[];
  process_steps: ProcessStep[];
  clients: Client[];
  navigation: { header: NavItem[]; footer: NavItem[] };
  contact: { channels: ContactChannel[]; social_links: SocialLink[] };
  settings: PublicSettings;
};

export function navHref(item: NavItem): string {
  return item.anchor ?? item.url ?? "#";
}

export async function fetchLanding(locale: string): Promise<LandingData> {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  const res = await fetch(`${BASE}/public/landing?locale=${locale}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600, tags: ["landing"] },
  });
  if (!res.ok) throw new Error(`Public landing API responded ${res.status}`);
  const json = await res.json();
  return json.data as LandingData;
}
