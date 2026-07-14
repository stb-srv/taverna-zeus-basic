import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { btnGhost } from "@/components/admin/ui";
import AllergenRow from "./AllergenRow";
import AddAllergen from "./AddAllergen";
import AdditiveRow from "./AdditiveRow";
import AddAdditive from "./AddAdditive";

export default async function AllergensAdminPage() {
  const supabase = await createClient();
  const [{ data: allergens }, { data: additives }] = await Promise.all([
    supabase.from("allergens").select("*").order("code"),
    supabase.from("additives").select("*").order("code"),
  ]);
  const t = await getTranslations("admin.menu.allergens");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/menu" className={btnGhost}>
          {t("backToMenu")}
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("allergensHeading")}</h2>
        {(allergens ?? []).map((a) => (
          <AllergenRow key={a.id} allergen={a} />
        ))}
        <AddAllergen />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("additivesHeading")}</h2>
        {(additives ?? []).map((a) => (
          <AdditiveRow key={a.id} additive={a} />
        ))}
        <AddAdditive />
      </section>
    </div>
  );
}
