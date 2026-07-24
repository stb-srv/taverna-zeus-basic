"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { importGoogleReviews, type GoogleSyncState } from "@/app/admin/actions/reviews";
import { btnGhost } from "@/components/admin/ui-classes";

const initial: GoogleSyncState = {};

export default function GoogleSyncButton() {
  const [state, action, pending] = useActionState(importGoogleReviews, initial);
  const t = useTranslations("admin.reviews");

  function message(): string | null {
    if (pending) return null;
    if (state.ok === true) return t("googleSyncDone", { count: state.imported ?? 0 });
    if (state.reason === "no_api_key") return t("googleSyncNoKey");
    if (state.ok === false && state.reason) return t("googleSyncError");
    return null;
  }

  const msg = message();

  return (
    <form action={action} className="flex items-center gap-2">
      <button type="submit" disabled={pending} className={btnGhost}>
        {pending ? t("googleSyncing") : t("googleSync")}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </form>
  );
}
