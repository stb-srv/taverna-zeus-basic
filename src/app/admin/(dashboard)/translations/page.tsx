import { createClient } from "@/lib/supabase/server";
import { localeNames, routing } from "@/i18n/routing";
import { getEnabledLocales } from "@/lib/locales";
import { collectTranslationStatus } from "@/lib/i18n-backfill";
import BackfillButton from "./BackfillButton";
import LocalesForm from "./LocalesForm";

export default async function TranslationsAdminPage() {
  const supabase = await createClient();
  const enabled = await getEnabledLocales();
  const status = await collectTranslationStatus(supabase, enabled);

  const total = status.reduce((n, t) => n + t.total, 0);
  const withGaps = status.reduce((n, t) => n + t.gaps.length, 0);
  const done = total - withGaps;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl">Übersetzungen</h1>
      <p className="mt-1 text-sm text-muted">
        Deutsch ist die Quellsprache. Beim Speichern werden leere Sprachen automatisch über
        LibreTranslate gefüllt — hier siehst du den Stand aller Inhalte und kannst Lücken
        gesammelt übersetzen lassen.
      </p>

      <section className="card-soft mt-6 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">Aktive Sprachen</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {enabled.length} von {routing.locales.length} verfügbaren Sprachen aktiv. Deutsch ist
          die Quellsprache und immer aktiv.
        </p>
        <LocalesForm enabled={enabled} />
      </section>

      <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-4 p-6 hover:translate-y-0">
        <div>
          <p className="font-display text-lg">
            {withGaps === 0
              ? "Alles übersetzt ✓"
              : `${done} von ${total} Einträgen vollständig übersetzt`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {withGaps === 0
              ? `Alle ${total} Einträge liegen in allen ${enabled.length} aktiven Sprachen vor.`
              : `${withGaps} ${withGaps === 1 ? "Eintrag hat" : "Einträge haben"} noch fehlende Sprachen.`}
          </p>
        </div>
        {withGaps > 0 && <BackfillButton />}
      </div>

      <div className="mt-6 space-y-4">
        {status.map((t) => (
          <section key={t.table} className="card-soft p-6 hover:translate-y-0">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">{t.label}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  t.gaps.length === 0
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {t.gaps.length === 0
                  ? `${t.total} / ${t.total} vollständig`
                  : `${t.gaps.length} von ${t.total} unvollständig`}
              </span>
            </div>

            {t.gaps.length > 0 && (
              <ul className="mt-4 divide-y divide-border/60">
                {t.gaps.map((row) => (
                  <li
                    key={String(row.id)}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="text-sm">{row.name}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {row.missing.map((loc) => (
                        <span
                          key={loc}
                          title={`${localeNames[loc]} fehlt`}
                          className="rounded-md bg-accent/10 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-accent"
                        >
                          {loc}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        Hinweis: Maschinell erzeugte Texte lassen sich pro Eintrag im Bereich „Weitere Sprachen“
        des jeweiligen Formulars nachbearbeiten. Manuell eingetragene Werte werden nie
        überschrieben.
      </p>
    </div>
  );
}
