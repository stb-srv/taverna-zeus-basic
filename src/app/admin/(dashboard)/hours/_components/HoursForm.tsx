"use client";

import { Fragment, useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { updateHours, type ActionState } from "@/app/admin/actions/hours";
import { inputCls, btnPrimary } from "@/components/admin/ui-classes";
import type { Database } from "@/lib/supabase/types";

type Hours = Database["public"]["Tables"]["opening_hours"]["Row"];
type KitchenHours = Database["public"]["Tables"]["kitchen_hours"]["Row"];

const days = [1, 2, 3, 4, 5, 6, 7] as const;

const initial: ActionState = {};

export default function HoursForm({
  hours,
  kitchenHours,
  kitchenHoursEnabled,
}: {
  hours: Hours[];
  kitchenHours: KitchenHours[];
  kitchenHoursEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(updateHours, initial);
  const [kitchenEnabled, setKitchenEnabled] = useState(kitchenHoursEnabled);
  const tDays = useTranslations("hours.days");
  const tHours = useTranslations("hours");
  const t = useTranslations("admin.hours");
  const tc = useTranslations("admin.common");

  // First row per weekday (the editor manages one range per day).
  const byDay = new Map<number, Hours>();
  for (const h of hours) if (!byDay.has(h.day_of_week)) byDay.set(h.day_of_week, h);
  const kitchenByDay = new Map<number, KitchenHours>();
  for (const h of kitchenHours) if (!kitchenByDay.has(h.day_of_week)) kitchenByDay.set(h.day_of_week, h);

  // Tracked in React (not just defaultChecked) so a closed day can hide its
  // kitchen row live, without a page reload — a closed day never needs its
  // own separate kitchen-closed checkbox on top.
  const [closedDays, setClosedDays] = useState<Set<number>>(
    () => new Set(days.filter((d) => byDay.get(d)?.is_closed ?? false)),
  );
  const toggleClosed = (day: number, closed: boolean) => {
    setClosedDays((prev) => {
      const next = new Set(prev);
      if (closed) next.add(day);
      else next.delete(day);
      return next;
    });
  };

  return (
    <form action={action} className="max-w-xl space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="kitchen_hours_enabled"
          checked={kitchenEnabled}
          onChange={(e) => setKitchenEnabled(e.target.checked)}
        />
        {t("kitchenHoursEnabled")}
      </label>
      <p className="text-xs text-muted">{t("kitchenHoursHint")}</p>

      <div className="card-soft overflow-x-auto p-2 hover:translate-y-0">
        <table className="w-full text-sm">
          <colgroup>
            <col className="w-28" />
            <col className="w-24" />
            <col />
          </colgroup>
          <tbody>
            {days.map((day) => {
              const row = byDay.get(day);
              const closed = closedDays.has(day);
              const kRow = kitchenByDay.get(day);
              const kClosed = kRow?.is_closed ?? false;
              // Kein separates "geschlossen" nötig, wenn der Tag ohnehin
              // komplett zu hat — daher immer im Formular gemountet (damit
              // Speichern nichts löscht), aber nur bei offenem Tag sichtbar.
              const showKitchenRow = kitchenEnabled;
              const kitchenRowVisible = showKitchenRow && !closed;

              return (
                <Fragment key={day}>
                  <tr className={kitchenRowVisible ? "" : "border-b border-border/60 last:border-0"}>
                    <td className="py-2 pr-2 font-medium">{tDays(String(day))}</td>
                    <td className="py-2 pr-2">
                      <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                        <input
                          type="checkbox"
                          name={`closed_${day}`}
                          checked={closed}
                          onChange={(e) => toggleClosed(day, e.target.checked)}
                        />
                        {tHours("closed")}
                      </label>
                    </td>
                    <td className="py-2">
                      <div className={`flex items-center gap-2 ${closed ? "opacity-40" : ""}`}>
                        <input
                          type="time"
                          name={`open_${day}`}
                          disabled={closed}
                          defaultValue={row?.open_time?.slice(0, 5) ?? "11:30"}
                          className={`${inputCls} w-full`}
                        />
                        <span className="text-muted">–</span>
                        <input
                          type="time"
                          name={`close_${day}`}
                          disabled={closed}
                          defaultValue={row?.close_time?.slice(0, 5) ?? "22:00"}
                          className={`${inputCls} w-full`}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Bleibt im Formular gemountet (nur per CSS versteckt),
                      auch wenn "Küchenzeiten aktivieren" aus ist oder der Tag
                      geschlossen ist — sonst würde Speichern die hinterlegten
                      Küchenzeiten löschen statt sie nur auszublenden. */}
                  <tr className={`border-b border-border/60 last:border-0 ${showKitchenRow && !closed ? "" : "hidden"}`}>
                    <td colSpan={2} className="py-1.5 pr-2 text-xs text-muted">
                      {tHours("kitchenHoursLabel")}
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          name={`kopen_${day}`}
                          defaultValue={kRow?.open_time?.slice(0, 5) ?? "14:00"}
                          className={`${inputCls} w-full`}
                        />
                        <span className="text-muted">–</span>
                        <input
                          type="time"
                          name={`kclose_${day}`}
                          defaultValue={kRow?.close_time?.slice(0, 5) ?? "21:30"}
                          className={`${inputCls} w-full`}
                        />
                        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                          <input type="checkbox" name={`kclosed_${day}`} defaultChecked={kClosed} />
                          {tHours("closed")}
                        </label>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">{t("hint")}</p>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc("saving") : tc("save")}
        </button>
        {state.ok && <span className="text-sm text-primary">{tc("saved")}</span>}
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
