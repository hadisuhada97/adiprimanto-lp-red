import { MetadataRoute } from "next";
import { fetchNavigation, fetchSeoEntry, fetchSettings } from "./lib/api/seo";

const FALLBACK_BASE = "https://adiprimanto.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, navigation, seo] = await Promise.all([
    fetchSettings(),
    fetchNavigation(),
    fetchSeoEntry("home"),
  ]);

  const base = (settings?.general?.base_url || FALLBACK_BASE).replace(/\/$/, "");
  const lastModified = new Date();
  const indexable = !(seo?.robots_directive ?? "").includes("noindex");

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  if (!indexable) return entries;

  const anchors = (navigation?.header ?? [])
    .map((item) => item.anchor ?? item.url ?? "")
    .filter((href) => href.startsWith("#") && href !== "#");

  const seen = new Set<string>();

  anchors.forEach((anchor) => {
    if (seen.has(anchor)) return;
    seen.add(anchor);
    entries.push({
      url: `${base}/${anchor}`,
      lastModified,
      changeFrequency: "monthly",
      priority: anchor === "#portfolio" || anchor === "#services" ? 0.9 : 0.8,
    });
  });

  return entries;
}
