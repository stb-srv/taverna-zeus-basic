"use server";

import { strOrNull } from "@/lib/form-data";
import { guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

export async function updateHours(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const rows = [];
    for (let day = 1; day <= 7; day++) {
      const closed = fd.get(`closed_${day}`) === "on";
      rows.push({
        day_of_week: day,
        is_closed: closed,
        open_time: closed ? null : strOrNull(fd, `open_${day}`),
        close_time: closed ? null : strOrNull(fd, `close_${day}`),
        sort_order: 0,
      });
    }
    // Replace the whole schedule (one range per day).
    const del = await supabase.from("opening_hours").delete().gte("day_of_week", 1);
    if (del.error) return { error: del.error.message };
    const ins = await supabase.from("opening_hours").insert(rows);
    if (ins.error) return { error: ins.error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
