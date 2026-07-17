"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUser, requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminLocale } from "@/i18n/locale-state";
import { str } from "@/lib/form-data";
import { guard, type ActionState } from "./shared";

export type { ActionState } from "./shared";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.login" });

  if (!email || !password) {
    return { error: t("errorMissingFields") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: t("errorInvalid") };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Create a confirmed auth user with a password and add them to the admins allowlist. */
export async function createAdminUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
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
export async function changeAdminPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
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

export async function addAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const email = str(fd, "email").toLowerCase();
    if (!emailRe.test(email)) {
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
