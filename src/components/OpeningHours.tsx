import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { formatTime } from "@/i18n/localized-content";
import type { Database } from "@/lib/supabase/types";

type Hours = Database["public"]["Tables"]["opening_hours"]["Row"];
type KitchenHours = Database["public"]["Tables"]["kitchen_hours"]["Row"];

function groupByDay<T extends { day_of_week: number }>(rows: T[]): Map<number, T[]> {
  const byDay = new Map<number, T[]>();
  for (const r of rows) {
    const list = byDay.get(r.day_of_week) ?? [];
    list.push(r);
    byDay.set(r.day_of_week, list);
  }
  return byDay;
}

function formatRanges(ranges: { open_time: string | null; close_time: string | null }[]): string {
  return ranges.map((r) => `${formatTime(r.open_time)}–${formatTime(r.close_time)}`).join(", ");
}

/**
 * Renders a Mon→Sun table of opening hours. When `kitchenHours` is given, a
 * smaller line with the kitchen's own hours appears directly under any day
 * that's open — kept out of closed days so "Geschlossen" stays a single line.
 */
export default async function OpeningHours({
  hours,
  kitchenHours = [],
}: {
  hours: Hours[];
  kitchenHours?: KitchenHours[];
}) {
  const t = await getTranslations("hours");

  const byDay = groupByDay(hours);
  const kitchenByDay = groupByDay(kitchenHours);

  return (
    <table className="w-full text-sm">
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const open = (byDay.get(day) ?? []).filter((r) => !r.is_closed && r.open_time && r.close_time);
          const kitchenOpen = (kitchenByDay.get(day) ?? []).filter(
            (r) => !r.is_closed && r.open_time && r.close_time,
          );
          const showKitchen = open.length > 0 && kitchenOpen.length > 0;

          return (
            <Fragment key={day}>
              <tr className={showKitchen ? "" : "border-b border-border/60 last:border-0"}>
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {t(`days.${day}`)}
                </th>
                <td className="py-2 text-right text-foreground/80">
                  {open.length === 0 ? <span className="text-muted">{t("closed")}</span> : formatRanges(open)}
                </td>
              </tr>
              {showKitchen && (
                <tr className="border-b border-border/60 last:border-0">
                  <td colSpan={2} className="pb-2 text-right text-xs text-muted">
                    {t("kitchenHoursLabel")} {formatRanges(kitchenOpen)}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
