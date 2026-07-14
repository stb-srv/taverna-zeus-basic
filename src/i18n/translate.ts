import "server-only";
import type { Locale } from "@/i18n/routing";

/**
 * Self-hosted LibreTranslate client. No cloud/Google — the endpoint is a local
 * or self-hosted container. Configured via env; falls back to localhost:5000.
 */
const ENDPOINT = (process.env.LIBRETRANSLATE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
const API_KEY = process.env.LIBRETRANSLATE_API_KEY;

export type BatchResult = {
  /** target locale → translated texts, aligned to the input order. */
  byLocale: Record<string, string[]>;
  ok: boolean;
  error?: string;
};

/**
 * Translates `texts` from `source` into each of `targets` (one request per
 * target; LibreTranslate accepts an array for `q`). Tolerant by design: on any
 * failure it returns `ok: false` with whatever succeeded, so callers can still
 * save the source content.
 */
export async function translateBatch(
  texts: string[],
  source: Locale,
  targets: Locale[],
): Promise<BatchResult> {
  const byLocale: Record<string, string[]> = {};
  if (texts.length === 0 || targets.length === 0) return { byLocale, ok: true };

  try {
    for (const target of targets) {
      if (target === source) {
        byLocale[target] = texts;
        continue;
      }
      const res = await fetch(`${ENDPOINT}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: texts,
          source,
          target,
          format: "text",
          ...(API_KEY ? { api_key: API_KEY } : {}),
        }),
        // Never cache translation calls.
        cache: "no-store",
      });
      if (!res.ok) {
        return { byLocale, ok: false, error: `LibreTranslate ${res.status} (${target})` };
      }
      const data = (await res.json()) as { translatedText?: string | string[] };
      const t = data.translatedText;
      byLocale[target] = Array.isArray(t) ? t : t != null ? [t] : [];
    }
    return { byLocale, ok: true };
  } catch (e) {
    return { byLocale, ok: false, error: (e as Error).message };
  }
}
