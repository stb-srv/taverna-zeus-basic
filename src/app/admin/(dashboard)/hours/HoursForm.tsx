"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateHours, type ActionState } from "@/app/admin/actions/hours";
import { inputCls, btnPrimary } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/types";

type Hours = Database["public"]["Tables"]["opening_hours"]["Row"];

const days = [1, 2, 3, 4, 5, 6, 7] as const;

const initial: ActionState = {};

export default function HoursForm({ hours }: { hours: Hours[] }) {
  const [state, action, pending] = useActionState(updateHours, initial);
  const tDays = useTranslations("hours.days");
  const tHours = useTranslations("hours");
  const t = useTranslations("admin.hours");
  const tc = useTranslations("admin.common");

  // First row per weekday (the editor manages one range per day).
  const byDay = new Map<number, Hours>();
  for (const h of hours) if (!byDay.has(h.day_of_week)) byDay.set(h.day_of_week, h);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="card-soft divide-y divide-border p-2 hover:translate-y-0">
        {days.map((day) => {
          const row = byDay.get(day);
          const closed = row?.is_closed ?? false;
          return (
            <div key={day} className="grid grid-cols-[1fr_auto] items-center gap-4 p-3 sm:grid-cols-[140px_auto_1fr]">
              <span className="font-medium">{tDays(String(day))}</span>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name={`closed_${day}`} defaultChecked={closed} />
                {tHours("closed")}
              </label>
              <div className="flex items-center gap-2 justify-self-end sm:justify-self-start">
                <input
                  type="time"
                  name={`open_${day}`}
                  defaultValue={row?.open_time?.slice(0, 5) ?? "11:30"}
                  className={`${inputCls} w-32`}
                />
                <span className="text-muted">–</span>
                <input
                  type="time"
                  name={`close_${day}`}
                  defaultValue={row?.close_time?.slice(0, 5) ?? "22:00"}
                  className={`${inputCls} w-32`}
                />
              </div>
            </div>
          );
        })}
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
