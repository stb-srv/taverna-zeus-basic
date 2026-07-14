"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { logout } from "../auth-actions";

/** Idle timeout before automatic logout, and how long before that to warn. */
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARN_BEFORE_MS = 60 * 1000; // show the warning 1 minute before (at 29 min)
const STORAGE_KEY = "meraki:last-activity";

/**
 * Logs the admin out after {@link TIMEOUT_MS} of inactivity. A warning dialog
 * with a live countdown appears one minute earlier. Activity (and the "stay
 * signed in" action) is shared across tabs via localStorage.
 */
export default function IdleLogout() {
  const t = useTranslations("admin.idleLogout");
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastActivity = useRef<number>(0);
  const loggingOut = useRef(false);

  const markActive = useCallback(() => {
    const now = Date.now();
    lastActivity.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      /* storage may be unavailable — per-tab timer still works */
    }
    setRemaining(null);
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      if (stored) lastActivity.current = stored;
    } catch {
      /* ignore */
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart", "pointermove"];
    // Throttle: only record activity at most once every 5s.
    let throttled = false;
    const onActivity = () => {
      if (throttled) return;
      throttled = true;
      setTimeout(() => (throttled = false), 5000);
      markActive();
    };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        lastActivity.current = Number(e.newValue);
        setRemaining(null);
      }
    };
    window.addEventListener("storage", onStorage);

    const tick = setInterval(() => {
      const left = TIMEOUT_MS - (Date.now() - lastActivity.current);
      if (left <= 0) {
        if (!loggingOut.current) {
          loggingOut.current = true;
          clearInterval(tick);
          logout();
        }
        return;
      }
      setRemaining(left <= WARN_BEFORE_MS ? left : null);
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, [markActive]);

  if (remaining === null) return null;

  const secs = Math.max(0, Math.ceil(remaining / 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="card-soft w-full max-w-sm p-6 text-center hover:translate-y-0">
        <h2 className="font-display text-xl">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("before")}</p>
        <p className="my-3 font-display text-4xl text-primary tabular-nums">{secs}s</p>
        <p className="text-sm text-muted">{t("after")}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={markActive}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            {t("stayLoggedIn")}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent-soft/60"
          >
            {t("logoutNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
