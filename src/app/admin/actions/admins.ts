"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { str } from "@/lib/form-data";
import { guard, type ActionState } from "./shared";

export type { ActionState } from "./shared";

export async function addAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const email = str(fd, "email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    }
    const { error } = await supabase.from("admins").insert({ email });
    if (error) {
      if (error.code === "23505") return { error: "Diese E-Mail ist bereits Admin." };
      return { error: error.message };
    }
    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function removeAdmin(fd: FormData) {
  const user = await getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const email = String(fd.get("email") ?? "").toLowerCase();
  // Prevent locking yourself out.
  if (email === (user.email ?? "").toLowerCase()) return;
  const supabase = await createClient();
  await supabase.from("admins").delete().eq("email", email);
  revalidatePath("/admin/admins");
}
