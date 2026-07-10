import { createClient } from "@/lib/supabase/server";

export type PricedItem = { name: string; price: number };

export type DashboardStats = {
  categories: number;
  items: number;
  activeItems: number;
  pages: number;
  pricedCount: number;
  avgPrice: number | null;
  priciest: PricedItem | null;
  cheapest: PricedItem | null;
};

/**
 * Aggregates the numbers shown on the admin dashboard. Prices are averaged and
 * ranked in JS (a restaurant menu is small), ignoring items without a price.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [catCount, pageCount, itemsRes] = await Promise.all([
    supabase.from("menu_categories").select("id", { count: "exact", head: true }),
    supabase.from("pages").select("id", { count: "exact", head: true }),
    supabase.from("menu_items").select("name_de, price, is_active"),
  ]);

  const items = itemsRes.data ?? [];
  const priced = items
    .filter((i): i is { name_de: string; price: number; is_active: boolean } => i.price != null)
    .map((i) => ({ name: i.name_de, price: Number(i.price) }));

  const sum = priced.reduce((acc, i) => acc + i.price, 0);
  const avgPrice = priced.length ? sum / priced.length : null;

  let priciest: PricedItem | null = null;
  let cheapest: PricedItem | null = null;
  for (const i of priced) {
    if (!priciest || i.price > priciest.price) priciest = i;
    if (!cheapest || i.price < cheapest.price) cheapest = i;
  }

  return {
    categories: catCount.count ?? 0,
    items: items.length,
    activeItems: items.filter((i) => i.is_active).length,
    pages: pageCount.count ?? 0,
    pricedCount: priced.length,
    avgPrice,
    priciest,
    cheapest,
  };
}

/** German euro formatting, e.g. "12,50 €". */
export function euro(value: number | null | undefined): string {
  if (value == null) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
