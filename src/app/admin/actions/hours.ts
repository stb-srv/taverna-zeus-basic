"use server";

import { strOrNull } from "@/lib/form-data";
import { guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

/** One combined form/save action for opening hours + kitchen hours — avoids two separate saves for two lists the admin edits together. */
export async function updateHours(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();

    const rows = [];
    const kitchenRows = [];
    for (let day = 1; day <= 7; day++) {
      const closed = fd.get(`closed_${day}`) === "on";
      rows.push({
        day_of_week: day,
        is_closed: closed,
        open_time: closed ? null : strOrNull(fd, `open_${day}`),
        close_time: closed ? null : strOrNull(fd, `close_${day}`),
        sort_order: 0,
      });

      const kClosed = fd.get(`kclosed_${day}`) === "on";
      kitchenRows.push({
        day_of_week: day,
        is_closed: kClosed,
        open_time: kClosed ? null : strOrNull(fd, `kopen_${day}`),
        close_time: kClosed ? null : strOrNull(fd, `kclose_${day}`),
        sort_order: 0,
      });
    }

    // Replace the whole schedule (one range per day) for both tables.
    const del = await supabase.from("opening_hours").delete().gte("day_of_week", 1);
    if (del.error) return { error: del.error.message };
    const ins = await supabase.from("opening_hours").insert(rows);
    if (ins.error) return { error: ins.error.message };

    const kDel = await supabase.from("kitchen_hours").delete().gte("day_of_week", 1);
    if (kDel.error) return { error: kDel.error.message };
    const kIns = await supabase.from("kitchen_hours").insert(kitchenRows);
    if (kIns.error) return { error: kIns.error.message };

    const kitchenEnabled = fd.get("kitchen_hours_enabled") === "on";
    const upd = await supabase
      .from("restaurant_settings")
      .update({ kitchen_hours_enabled: kitchenEnabled })
      .eq("id", 1);
    if (upd.error) return { error: upd.error.message };

    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
