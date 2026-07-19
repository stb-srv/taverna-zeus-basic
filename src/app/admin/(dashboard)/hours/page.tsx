import { getTranslations } from "next-intl/server";
import { getOpeningHours, getKitchenHours, getSettings } from "@/lib/queries";
import HoursForm from "./_components/HoursForm";

export default async function HoursPage() {
  const [hours, kitchenHours, settings] = await Promise.all([
    getOpeningHours(),
    getKitchenHours(),
    getSettings(),
  ]);
  const t = await getTranslations("admin.hours");
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("subtitle")}</p>
      <HoursForm hours={hours} kitchenHours={kitchenHours} kitchenHoursEnabled={settings?.kitchen_hours_enabled ?? false} />
    </div>
  );
}
