import type { MetadataRoute } from "next";
import { getEnabledLocales } from "@/i18n/locale-state";
import { getPublishedPages } from "@/lib/queries";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/menu", priority: 0.7, changeFrequency: "monthly" },
  { path: "/location", priority: 0.7, changeFrequency: "monthly" },
  { path: "/datenschutz", priority: 0.3, changeFrequency: "monthly" },
  { path: "/impressum", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const [locales, pages] = await Promise.all([getEnabledLocales(), getPublishedPages()]);

  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    const languages = Object.fromEntries(locales.map((l) => [l, `${base}/${l}${route.path}`]));
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${route.path}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      });
    }
  }

  for (const page of pages) {
    const languages = Object.fromEntries(locales.map((l) => [l, `${base}/${l}/${page.slug}`]));
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/${page.slug}`,
        lastModified: page.updated_at,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: { languages },
      });
    }
  }

  return entries;
}
