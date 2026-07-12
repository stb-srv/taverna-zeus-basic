"use client";

import { useActionState } from "react";
import {
  translateAllMissing,
  type TranslateAllState,
} from "@/app/admin/actions/translations";
import { btnPrimary } from "../ui";

const initial: TranslateAllState = {};

/** Triggers the bulk LibreTranslate backfill and shows the outcome. */
export default function BackfillButton() {
  const [state, action, pending] = useActionState(translateAllMissing, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Übersetze … (kann etwas dauern)" : "Fehlende Übersetzungen erstellen"}
      </button>
      {state.ok && (
        <span className="text-sm text-primary">
          {state.translated} {state.translated === 1 ? "Übersetzung" : "Übersetzungen"} erstellt ✓
        </span>
      )}
      {state.error && (
        <span className="text-sm text-accent">
          Fehler: {state.error}
          {state.translated ? ` — ${state.translated} Übersetzungen wurden trotzdem gespeichert.` : ""}
        </span>
      )}
    </form>
  );
}
