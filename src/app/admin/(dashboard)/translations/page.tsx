import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ENABLED_LOCALES, localeNames, routing, type Locale } from "@/i18n/routing";
import { getEnabledLocales } from "@/i18n/locale-state";
import { collectTranslationStatus } from "@/i18n/backfill";
import { missingUiLocales } from "@/i18n/ui-messages";
import { checkLibreTranslateHealth } from "@/i18n/translate";
import TranslateAllButton from "./_components/TranslateAllButton";
import LocalesForm from "./_components/LocalesForm";

export default async function TranslationsAdminPage() {
  const supabase = await createClient();
  const enabled = await getEnabledLocales();
  const status = await collectTranslationStatus(supabase, enabled);
  const health = await checkLibreTranslateHealth();
  const t = await getTranslations("admin.translationsPage");

  const total = status.reduce((n, s) => n + s.total, 0);
  const withGaps = status.reduce((n, s) => n + s.gaps.length, 0);
  const done = total - withGaps;

  const uiGoals = enabled.filter((l) => !(DEFAULT_ENABLED_LOCALES as readonly Locale[]).includes(l));
  const { data: settingsRow } = await supabase
    .from("restaurant_settings")
    .select("ui_messages")
    .eq("id", 1)
    .maybeSingle();
  const uiGaps = missingUiLocales(settingsRow?.ui_messages, enabled);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("intro")}</p>

      <section className="card-soft mt-6 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">{t("activeLanguages")}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {enabled.length} {t("of")} {routing.locales.length} {t("availableActive")} {t("sourceLanguageNote")}
        </p>
        <LocalesForm enabled={enabled} />
      </section>

      <section className="card-soft mt-6 p-6 hover:translate-y-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">{t("serviceTitle")}</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              health.reachable ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
            }`}
          >
            {health.reachable ? t("serviceReachable") : t("serviceUnreachable")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {health.configured ? health.url : `${health.url} (${t("serviceDefaultHint")})`}
          {health.error ? ` — ${health.error}` : ""}
        </p>
      </section>

      {uiGoals.length > 0 && (
        <section className="card-soft mt-6 p-6 hover:translate-y-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">{t("uiTextsTitle")}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                uiGaps.length === 0 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
              }`}
            >
              {uiGaps.length === 0
                ? `${uiGoals.length} / ${uiGoals.length} ${t("completeSuffix")}`
                : `${uiGoals.length - uiGaps.length} / ${uiGoals.length} ${t("incompleteSuffix")}`}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{t("uiTextsIntro")}</p>
          {uiGaps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {uiGaps.map((loc) => (
                <span
                  key={loc}
                  title={`${localeNames[loc]} ${t("missingSuffix")}`}
                  className="rounded-md bg-accent/10 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-accent"
                >
                  {loc}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-4 p-6 hover:translate-y-0">
        <div>
          <p className="font-display text-lg">
            {withGaps === 0
              ? t("allTranslated")
              : `${done} ${t("entriesCompleteMiddle")} ${total} ${t("entriesCompleteSuffix")}`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {withGaps === 0
              ? `${t("allEntriesPrefix")} ${total} ${t("allEntriesMiddle")} ${enabled.length} ${t("allEntriesSuffix")}`
              : `${withGaps} ${withGaps === 1 ? t("entryHasGaps") : t("entriesHaveGapsNoun")} ${t("entriesHaveGapsSuffix")}`}
          </p>
        </div>
        {withGaps > 0 && <TranslateAllButton />}
      </div>

      <div className="mt-6 space-y-4">
        {status.map((s) => (
          <section key={s.table} className="card-soft p-6 hover:translate-y-0">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">{s.label}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  s.gaps.length === 0
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {s.gaps.length === 0
                  ? `${s.total} / ${s.total} ${t("completeSuffix")}`
                  : `${s.gaps.length} ${t("of")} ${s.total} ${t("incompleteSuffix")}`}
              </span>
            </div>

            {s.gaps.length > 0 && (
              <ul className="mt-4 divide-y divide-border/60">
                {s.gaps.map((row) => (
                  <li
                    key={String(row.id)}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="text-sm">{row.name}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {row.missing.map((loc) => (
                        <span
                          key={loc}
                          title={`${localeNames[loc]} ${t("missingSuffix")}`}
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

      <p className="mt-6 text-xs text-muted">{t("footerHint")}</p>
    </div>
  );
}
