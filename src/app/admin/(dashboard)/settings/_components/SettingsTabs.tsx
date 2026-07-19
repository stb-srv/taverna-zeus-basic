"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SettingsForm from "./SettingsForm";
import SmtpSettingsForm, { type SmtpSettings } from "./SmtpSettingsForm";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["restaurant_settings"]["Row"];

export const TABS = ["location", "social", "smtp", "closure"] as const;
export type Tab = (typeof TABS)[number];

/**
 * Owns the active tab so `SettingsForm` (one combined <form>/save action for
 * location+social+closure) can keep every section mounted and just hide the
 * inactive ones — unmounting would drop unsaved edits in a tab the admin
 * isn't currently looking at. SMTP is a separate form/action entirely, hidden
 * the same way for a consistent feel.
 */
export default function SettingsTabs({
  settings,
  smtpSettings,
}: {
  settings: Settings | null;
  smtpSettings: SmtpSettings | null;
}) {
  const [tab, setTab] = useState<Tab>("location");
  const t = useTranslations("admin.settings");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t(`tab_${key}`)}
          </button>
        ))}
      </div>
      <SettingsForm settings={settings} activeTab={tab} />
      <div className={`max-w-2xl ${tab === "smtp" ? "" : "hidden"}`}>
        <SmtpSettingsForm settings={smtpSettings} />
      </div>
    </div>
  );
}
