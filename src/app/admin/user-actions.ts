"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminLocale } from "@/i18n/locale-state";

export type State = { ok?: boolean; error?: string };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Create a confirmed auth user with a password and add them to the admins allowlist. */
export async function createAdminUser(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireAdmin();
    const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.errors" });
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (!emailRe.test(email)) return { error: t("invalidEmail") };
    if (password.length < 8) return { error: t("passwordTooShort") };

    const admin = createAdminClient();
    const { error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    // Ignore "already registered" so an existing account can still be allowlisted.
    if (cErr && !/registered|already|exists/i.test(cErr.message)) {
      return { error: cErr.message };
    }

    const supabase = await createClient();
    const { error: aErr } = await supabase.from("admins").upsert({ email }, { onConflict: "email" });
    if (aErr) return { error: aErr.message };

    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Set a new password for an existing admin account (found by email). */
export async function changeAdminPassword(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireAdmin();
    const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.errors" });
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) return { error: t("passwordTooShort") };

    const admin = createAdminClient();
    // Locate the auth user by email (paginated; fine for a small team).
    const { data, error: lErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (lErr) return { error: lErr.message };
    const target = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (!target) {
      return { error: t("accountNotFound") };
    }

    const { error: uErr } = await admin.auth.admin.updateUserById(target.id, { password });
    if (uErr) return { error: uErr.message };
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
