"use server";

import { str, strOrNull } from "@/lib/form-data";
import { sendTestEmail } from "@/lib/mail";
import { guard, type ActionState } from "./shared";
import type { Database } from "@/lib/supabase/types";

export type { ActionState } from "./shared";

type SmtpUpdate = Database["public"]["Tables"]["smtp_settings"]["Update"];

export async function updateSmtpSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const password = str(fd, "password");
    const patch: SmtpUpdate = {
      host: strOrNull(fd, "host"),
      port: strOrNull(fd, "port") ? Number(str(fd, "port")) : null,
      username: strOrNull(fd, "username"),
      from_address: strOrNull(fd, "from_address"),
      notify_email: strOrNull(fd, "notify_email"),
    };
    // Leeres Feld = vorhandenes Passwort behalten (wird nie ans Formular zurückgegeben).
    if (password) patch.password = password;
    const { error } = await supabase.from("smtp_settings").update(patch).eq("id", 1);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function testSmtpConnection(_prev: ActionState, _fd: FormData): Promise<ActionState> {
  try {
    await guard(); // nur eingeloggte Admins dürfen eine Test-Mail auslösen
  } catch (e) {
    return { error: (e as Error).message };
  }
  const result = await sendTestEmail();
  return result.ok ? { ok: true } : { error: result.error };
}
