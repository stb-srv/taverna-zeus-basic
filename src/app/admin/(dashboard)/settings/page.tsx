import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import SettingsTabs from "./_components/SettingsTabs";

export default async function SettingsPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data: smtpSettings } = await supabase
    .from("smtp_settings")
    .select("host, port, username, from_address, notify_email, password")
    .eq("id", 1)
    .maybeSingle();
  // Das Passwort darf nie ans Client-Bundle gehen (SmtpSettingsForm ist "use
  // client" — jeder Prop landet in der an den Browser gesendeten RSC-Payload,
  // auch wenn er nirgends gerendert wird). Nur ein Bool-Flag durchreichen.
  const smtpSettingsForClient = smtpSettings
    ? { ...smtpSettings, password: undefined, hasPassword: Boolean(smtpSettings.password) }
    : null;
  const t = await getTranslations("admin.settings");
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("subtitle")}</p>
      <SettingsTabs settings={settings} smtpSettings={smtpSettingsForClient} />
    </div>
  );
}
