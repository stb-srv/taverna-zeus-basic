"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { routing, type Locale } from "@/i18n/routing";
import { ADMIN_LOCALE_COOKIE, getEnabledLocales } from "@/lib/locales";

/**
 * Sets the admin UI's own display language (independent of the public site's
 * content locale). No auth guard — must also work from the pre-login page.
 */
export async function setAdminLocale(fd: FormData) {
  const value = String(fd.get("locale") ?? "");
  const enabled = await getEnabledLocales();
  if (!routing.locales.includes(value as Locale) || !enabled.includes(value as Locale)) return;

  const store = await cookies();
  store.set(ADMIN_LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // getAdminLocale() is read in the root admin layout, which otherwise
  // doesn't reliably re-run on the next request just because the cookie
  // changed — leaving the switch looking like it "reverts" to German.
  revalidatePath("/admin", "layout");
}
