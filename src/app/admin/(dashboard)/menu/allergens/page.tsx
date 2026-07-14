import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnGhost } from "../../ui";
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

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Allergene &amp; Zusatzstoffe</h1>
          <p className="mt-1 text-sm text-muted">Definitionen verwalten, die Speisen zugewiesen werden können.</p>
        </div>
        <Link href="/admin/menu" className={btnGhost}>
          Zurück zur Speisekarte
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Allergene</h2>
        {(allergens ?? []).map((a) => (
          <AllergenRow key={a.id} allergen={a} />
        ))}
        <AddAllergen />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Zusatzstoffe</h2>
        {(additives ?? []).map((a) => (
          <AdditiveRow key={a.id} additive={a} />
        ))}
        <AddAdditive />
      </section>
    </div>
  );
}
