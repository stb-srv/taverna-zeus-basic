import Link from "next/link";
import { getDashboardStats, euro } from "./dashboard/data";
import {
  StatCard,
  PriceHighlightCard,
  IconLayers,
  IconDish,
  IconAverage,
  IconTrendUp,
  IconTrendDown,
} from "./dashboard/widgets";

const sections = [
  { href: "/admin/menu", title: "Speisekarte", desc: "Kategorien & Speisen verwalten, Bilder, Allergene." },
  { href: "/admin/hours", title: "Öffnungszeiten", desc: "Zeiten pro Wochentag festlegen." },
  { href: "/admin/settings", title: "Standort & Kontakt", desc: "Adresse, Telefon, E-Mail, Karte, Hero-Bild." },
  { href: "/admin/pages", title: "Seiten", desc: "Impressum, Datenschutz und weitere Seiten." },
];

export default async function AdminHome() {
  const s = await getDashboardStats();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Willkommen im Verwaltungsbereich der Taverna Zeus.</p>

      {/* Kennzahlen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Kategorien"
          value={s.categories}
          icon={<IconLayers />}
        />
        <StatCard
          label="Speisen"
          value={s.items}
          icon={<IconDish />}
          hint={`${s.activeItems} aktiv sichtbar`}
        />
        <StatCard
          label="Ø Preis"
          value={euro(s.avgPrice)}
          icon={<IconAverage />}
          hint={`über ${s.pricedCount} Speisen mit Preis`}
        />
      </div>

      {/* Preis-Spitzenreiter */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PriceHighlightCard
          title="Teuerste Speise"
          name={s.priciest?.name ?? null}
          price={euro(s.priciest?.price)}
          icon={<IconTrendUp />}
          tone="primary"
        />
        <PriceHighlightCard
          title="Günstigste Speise"
          name={s.cheapest?.name ?? null}
          price={euro(s.cheapest?.price)}
          icon={<IconTrendDown />}
          tone="accent"
        />
      </div>

      {/* Schnellzugriff */}
      <h2 className="mt-10 font-display text-xl">Schnellzugriff</h2>
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
