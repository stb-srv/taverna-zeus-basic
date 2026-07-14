import { getTranslations } from "next-intl/server";
import { getOpeningHours } from "@/lib/queries";
import HoursForm from "./HoursForm";

export default async function HoursPage() {
  const hours = await getOpeningHours();
  const t = await getTranslations("admin.hours");
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("subtitle")}</p>
      <HoursForm hours={hours} />
    </div>
  );
}
