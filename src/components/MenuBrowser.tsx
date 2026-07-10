"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { MenuCategory } from "@/lib/queries";
import { localized, formatPrice } from "@/lib/locale";

/**
 * Interactive menu: free-text dish search + toggleable category chips.
 * - No chip selected → all categories shown.
 * - Clicking a chip adds its category to the view; clicking it again removes it.
 * - Search filters dishes by name/description across the visible categories.
 */
export default function MenuBrowser({
  categories,
  locale,
}: {
  categories: MenuCategory[];
  locale: Locale;
}) {
  const t = useTranslations("menu");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  function toggleCategory(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const normalizedQuery = query.trim().toLowerCase();

  // Apply category selection first, then the text search within each category.
  const visible = useMemo(() => {
    const byCategory = selected.size === 0 ? categories : categories.filter((c) => selected.has(c.id));

    return byCategory
      .map((category) => {
        const items = normalizedQuery
          ? category.menu_items.filter((item) => {
              const haystack = [
                localized(item, "name", locale),
                localized(item, "description", locale),
                item.item_number ?? "",
              ]
                .join(" ")
                .toLowerCase();
              return haystack.includes(normalizedQuery);
            })
          : category.menu_items;
        return { category, items };
      })
      // While searching, hide categories that have no matches.
      .filter(({ items }) => !normalizedQuery || items.length > 0);
  }, [categories, selected, normalizedQuery, locale]);

  const totalItems = visible.reduce((sum, { items }) => sum + items.length, 0);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full rounded-full border border-border bg-card px-5 py-3.5 pr-12 text-sm shadow-sm outline-none transition focus:border-primary focus:shadow-md focus:ring-4 focus:ring-primary/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("searchClear")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          aria-pressed={selected.size === 0}
          className={chipClass(selected.size === 0)}
        >
          {t("allCategories")}
        </button>
        {categories.map((category) => {
          const active = selected.has(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              aria-pressed={active}
              className={chipClass(active)}
            >
              {localized(category, "name", locale)}
            </button>
          );
        })}
      </div>

      <p className="mb-6 text-xs text-muted" aria-live="polite">
        {t("resultCount", { count: totalItems })}
      </p>

      {/* Filtered list */}
      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t("noResults")}</p>
      ) : (
        <div className="space-y-12">
          {visible.map(({ category, items }) => (
            <section key={category.id}>
              <h2 className="rule-gold mb-3 inline-block text-2xl text-primary">
                {localized(category, "name", locale)}
              </h2>
              {localized(category, "description", locale) && (
                <p className="mt-2 text-sm text-muted">
                  {localized(category, "description", locale)}
                </p>
              )}

              {items.length === 0 ? (
                <p className="mt-4 text-sm text-muted">{t("noItems")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {items.map((item) => {
                    const codes = [
                      ...item.menu_item_allergens.map((a) => a.allergens?.code),
                      ...item.menu_item_additives.map((a) => a.additives?.code),
                    ].filter(Boolean);

                    return (
                      <li
                        key={item.id}
                        className="-mx-3 flex gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-accent-soft/40"
                      >
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={localized(item, "name", locale)}
                            width={96}
                            height={96}
                            className="h-24 w-24 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="font-display text-lg">
                              {item.item_number && (
                                <span className="mr-2 text-sm text-muted">{item.item_number}</span>
                              )}
                              {localized(item, "name", locale)}
                              {codes.length > 0 && (
                                <sup className="ml-1 text-xs text-muted">({codes.join(", ")})</sup>
                              )}
                            </h3>
                            <span className="whitespace-nowrap font-medium text-primary">
                              {formatPrice(item.price, locale)}
                            </span>
                          </div>
                          {localized(item, "description", locale) && (
                            <p className="mt-1 text-sm text-foreground/70">
                              {localized(item, "description", locale)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function chipClass(active: boolean): string {
  return [
    "rounded-full border px-4 py-1.5 text-sm font-medium transition duration-200",
    active
      ? "border-transparent bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20"
      : "border-border bg-card text-foreground/70 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-sm",
  ].join(" ");
}
