import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/queries";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();
  const t = await getTranslations("admin.settings");
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("subtitle")}</p>
      <SettingsForm settings={settings} />
    </div>
  );
}
