import { getTranslations } from "next-intl/server";
import { formatTime } from "@/i18n/localized-content";
import type { Database } from "@/lib/supabase/types";

type KitchenHours = Database["public"]["Tables"]["kitchen_hours"]["Row"];

/** Groups multiple time ranges per weekday and renders a Mon→Sun table (mirrors OpeningHours). */
export default async function KitchenHours({ hours }: { hours: KitchenHours[] }) {
  const t = await getTranslations("hours");

  const byDay = new Map<number, KitchenHours[]>();
  for (const h of hours) {
    const list = byDay.get(h.day_of_week) ?? [];
    list.push(h);
    byDay.set(h.day_of_week, list);
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const ranges = byDay.get(day) ?? [];
          const open = ranges.filter((r) => !r.is_closed && r.open_time && r.close_time);
          return (
            <tr key={day} className="border-b border-border/60 last:border-0">
              <th scope="row" className="py-2 pr-4 text-left font-medium">
                {t(`days.${day}`)}
              </th>
              <td className="py-2 text-right text-foreground/80">
                {open.length === 0 ? (
                  <span className="text-muted">{t("closed")}</span>
                ) : (
                  open
                    .map((r) => `${formatTime(r.open_time)}–${formatTime(r.close_time)}`)
                    .join(", ")
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
