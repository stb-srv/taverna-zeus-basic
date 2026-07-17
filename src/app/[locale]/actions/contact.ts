"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { sendContactNotification } from "@/lib/mail";
import { str, strOrNull } from "@/lib/form-data";
import type { Locale } from "@/i18n/routing";

export type ContactState = { ok?: boolean; error?: string };

// Bots that fill the honeypot or submit faster than a human ever could get a
// silent "success" — never reveal that they were detected.
const MIN_FILL_TIME_MS = 2500;

// In-memory per-instance limiter. Valid because this app runs as a single
// long-lived Node process (Docker `output: "standalone"`, one Coolify
// container) — resets on redeploy/restart and does not coordinate across
// replicas if ever scaled horizontally, which is an accepted tradeoff here.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  // Trusts the reverse proxy (Coolify/Traefik) to overwrite rather than
  // append-trust this header from the client — otherwise spoofable.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function submitContactMessage(
  _prev: ContactState,
  fd: FormData,
): Promise<ContactState> {
  const locale = (strOrNull(fd, "locale") ?? "de") as Locale;
  const t = await getTranslations({ locale, namespace: "location" });

  // Honeypot: real visitors never fill this hidden field.
  if (str(fd, "website") !== "") {
    return { ok: true };
  }

  // Timing trap: the field is rendered server-side with the page's own
  // render timestamp, so a submit faster than MIN_FILL_TIME_MS is not human.
  const renderedAt = Number(str(fd, "form_rendered_at"));
  if (!renderedAt || Date.now() - renderedAt < MIN_FILL_TIME_MS) {
    return { ok: true };
  }

  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { error: t("contactErrorRateLimited") };
  }

  const name = str(fd, "name");
  const email = str(fd, "email");
  const message = str(fd, "message");
  const phone = strOrNull(fd, "phone");

  if (!name || !message) return { error: t("contactErrorRequired") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t("contactErrorEmail") };

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    phone,
    message,
    locale,
  });
  if (error) return { error: t("contactErrorGeneric") };

  await sendContactNotification({ name, email, phone, message, locale });

  return { ok: true };
}
