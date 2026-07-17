import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getDashboardStats, euro } from "./_components/data";
import {
  StatCard,
  PriceHighlightCard,
  IconLayers,
  IconDish,
  IconAverage,
  IconTrendUp,
  IconTrendDown,
  IconMail,
} from "./_components/widgets";

export default async function AdminHome() {
  const s = await getDashboardStats();
  const t = await getTranslations("admin.dashboard");

  const sections = [
    { href: "/admin/menu", title: t("menuTitle"), desc: t("menuDesc") },
    { href: "/admin/hours", title: t("hoursTitle"), desc: t("hoursDesc") },
    { href: "/admin/settings", title: t("settingsTitle"), desc: t("settingsDesc") },
    { href: "/admin/pages", title: t("pagesTitle"), desc: t("pagesDesc") },
    { href: "/admin/translations", title: t("translationsTitle"), desc: t("translationsDesc") },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("welcome")}</p>

      {/* Kennzahlen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("statCategories")}
          value={s.categories}
          icon={<IconLayers />}
        />
        <StatCard
          label={t("statItems")}
          value={s.items}
          icon={<IconDish />}
          hint={`${s.activeItems} ${t("statActiveHint")}`}
        />
        <StatCard
          label={t("statAvgPrice")}
          value={euro(s.avgPrice)}
          icon={<IconAverage />}
          hint={`${t("statAvgPriceHintPrefix")} ${s.pricedCount} ${t("statAvgPriceHintSuffix")}`}
        />
        <StatCard
          label={t("statUnreadMessages")}
          value={s.unreadMessages}
          icon={<IconMail />}
        />
      </div>

      {/* Preis-Spitzenreiter */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PriceHighlightCard
          title={t("mostExpensive")}
          name={s.priciest?.name ?? null}
          emptyLabel={t("noPricedDish")}
          price={euro(s.priciest?.price)}
          icon={<IconTrendUp />}
          tone="primary"
        />
        <PriceHighlightCard
          title={t("cheapest")}
          name={s.cheapest?.name ?? null}
          emptyLabel={t("noPricedDish")}
          price={euro(s.cheapest?.price)}
          icon={<IconTrendDown />}
          tone="accent"
        />
      </div>

      {/* Schnellzugriff */}
      <h2 className="mt-10 font-display text-xl">{t("quickAccess")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {sections.map((sec) => (
          <Link key={sec.href} href={sec.href} className="card-soft group block p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-primary">{sec.title}</h3>
              <span className="text-primary/50 transition group-hover:translate-x-0.5 group-hover:text-primary">
                →
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/70">{sec.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
