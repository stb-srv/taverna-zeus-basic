"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { sendContactNotification } from "@/lib/mail";
import { str, strOrNull } from "@/lib/form-data";
import { MIN_FILL_TIME_MS, createRateLimiter, getClientIp, logSpamBlock } from "@/lib/spam-guard";
import type { Locale } from "@/i18n/routing";

export type ContactState = { ok?: boolean; error?: string };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const isRateLimited = createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

export async function submitContactMessage(
  _prev: ContactState,
  fd: FormData,
): Promise<ContactState> {
  const locale = (strOrNull(fd, "locale") ?? "de") as Locale;
  const t = await getTranslations({ locale, namespace: "location" });
  const ip = await getClientIp();

  // Honeypot: real visitors never fill this hidden field.
  if (str(fd, "website") !== "") {
    await logSpamBlock("honeypot", ip, locale);
    return { ok: true };
  }

  // Timing trap: the field is rendered server-side with the page's own
  // render timestamp, so a submit faster than MIN_FILL_TIME_MS is not human.
  const renderedAt = Number(str(fd, "form_rendered_at"));
  if (!renderedAt || Date.now() - renderedAt < MIN_FILL_TIME_MS) {
    await logSpamBlock("too_fast", ip, locale);
    return { ok: true };
  }

  if (isRateLimited(ip)) {
    console.warn(`[contact] rate limited: ip=${ip}`);
    return { error: t("contactErrorRateLimited") };
  }

  const name = str(fd, "name");
  const email = str(fd, "email");
  const message = str(fd, "message");
  const phone = strOrNull(fd, "phone");

  if (!name || !message) return { error: t("contactErrorRequired") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t("contactErrorEmail") };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      phone,
      message,
      locale,
    });
    if (error) {
      console.error("[contact] insert failed:", error.code, error.message, error.details);
      return { error: t("contactErrorGeneric") };
    }

    await sendContactNotification({ name, email, phone, message, locale });
    return { ok: true };
  } catch (e) {
    console.error("[contact] unexpected error:", e);
    return { error: t("contactErrorGeneric") };
  }
}
