"use client";

import { useActionState } from "react";
import { updateHours, type ActionState } from "@/app/admin/actions/hours";
import { inputCls, btnPrimary } from "../ui";
import type { Database } from "@/lib/supabase/types";

type Hours = Database["public"]["Tables"]["opening_hours"]["Row"];

const days = [
  [1, "Montag"],
  [2, "Dienstag"],
  [3, "Mittwoch"],
  [4, "Donnerstag"],
  [5, "Freitag"],
  [6, "Samstag"],
  [7, "Sonntag"],
] as const;

const initial: ActionState = {};

export default function HoursForm({ hours }: { hours: Hours[] }) {
  const [state, action, pending] = useActionState(updateHours, initial);

  // First row per weekday (the editor manages one range per day).
  const byDay = new Map<number, Hours>();
  for (const h of hours) if (!byDay.has(h.day_of_week)) byDay.set(h.day_of_week, h);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="card-soft divide-y divide-border p-2 hover:translate-y-0">
        {days.map(([day, label]) => {
          const row = byDay.get(day);
          const closed = row?.is_closed ?? false;
          return (
            <div key={day} className="grid grid-cols-[1fr_auto] items-center gap-4 p-3 sm:grid-cols-[140px_auto_1fr]">
              <span className="font-medium">{label}</span>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name={`closed_${day}`} defaultChecked={closed} />
                geschlossen
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

      <p className="text-xs text-muted">
        Hinweis: Der Editor verwaltet eine Zeitspanne pro Tag. Mehrere Spannen (z. B. Mittagspause)
        können bei Bedarf ergänzt werden.
      </p>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Speichern …" : "Speichern"}
        </button>
        {state.ok && <span className="text-sm text-primary">Gespeichert ✓</span>}
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
