"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  translateAllMissing,
  type TranslateAllState,
} from "@/app/admin/actions/translations";
import { btnPrimary } from "../ui";

const initial: TranslateAllState = {};

/** Triggers the bulk LibreTranslate backfill and shows the outcome. */
export default function BackfillButton() {
  const [state, action, pending] = useActionState(translateAllMissing, initial);
  const t = useTranslations("admin.backfillButton");

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? t("running") : t("run")}
      </button>
      {state.ok && (
        <span className="text-sm text-primary">
          {state.translated} {state.translated === 1 ? t("createdOne") : t("createdMany")} {t("createdSuffix")}
        </span>
      )}
      {state.error && (
        <span className="text-sm text-accent">
          {t("errorPrefix")} {state.error}
          {state.translated ? ` — ${state.translated} ${t("errorSavedAnywaySuffix")}` : ""}
        </span>
      )}
    </form>
  );
}
