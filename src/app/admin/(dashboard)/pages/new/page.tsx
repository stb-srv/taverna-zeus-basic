import { getTranslations } from "next-intl/server";
import PageForm from "../_components/PageForm";

export default async function NewPage() {
  const t = await getTranslations("admin.pages");
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">{t("newPageTitle")}</h1>
      <PageForm page={null} />
    </div>
  );
}
