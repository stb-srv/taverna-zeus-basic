import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Bots that fill the honeypot or submit faster than a human ever could get a
// silent "success" — never reveal that they were detected.
export const MIN_FILL_TIME_MS = 2500;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Trusts the reverse proxy (Coolify/Traefik) to overwrite rather than
  // append-trust this header from the client — otherwise spoofable.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Best-effort record of a triggered bot trap, so /admin/messages can show how often it fires. Never throws. */
export async function logSpamBlock(
  reason: "honeypot" | "too_fast",
  ip: string,
  locale: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("spam_blocks").insert({ reason, ip, locale });
  } catch (e) {
    console.error("[spam-guard] Spam-Log fehlgeschlagen:", e);
  }
}

/**
 * In-memory per-instance limiter factory — each form action keeps its own
 * map. Valid because this app runs as a single long-lived Node process
 * (Docker `output: "standalone"`, one Coolify container) — resets on
 * redeploy/restart and does not coordinate across replicas if ever scaled
 * horizontally, which is an accepted tradeoff here.
 */
export function createRateLimiter(max: number, windowMs: number): (ip: string) => boolean {
  const hits = new Map<string, number[]>();
  return function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > max;
  };
}
