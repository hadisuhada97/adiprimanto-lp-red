import { MetadataRoute } from "next";
import { fetchSeoEntry, fetchSettings } from "./lib/api/seo";

const FALLBACK_BASE = "https://adiprimanto.com";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [settings, seo] = await Promise.all([
    fetchSettings(),
    fetchSeoEntry("home"),
  ]);

  const base = (settings?.general?.base_url || FALLBACK_BASE).replace(/\/$/, "");
  const directive = (seo?.robots_directive ?? "index,follow").toLowerCase();
  const disallowAll = directive.includes("noindex");

  return {
    rules: disallowAll
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${base}/sitemap.xml`,
  };
}
