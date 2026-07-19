"use server";

import { revalidatePath } from "next/cache";
import { str } from "@/lib/form-data";
import { guard } from "./shared";

export async function markAsRead(fd: FormData) {
  const supabase = await guard();
  await supabase
    .from("contact_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", Number(str(fd, "id")));
  revalidatePath("/admin/messages");
}

export async function deleteMessage(fd: FormData) {
  const supabase = await guard();
  await supabase.from("contact_messages").delete().eq("id", Number(str(fd, "id")));
  revalidatePath("/admin/messages");
}

export async function clearSpamLog() {
  const supabase = await guard();
  await supabase.from("spam_blocks").delete().gte("id", 0);
  revalidatePath("/admin/messages");
}
