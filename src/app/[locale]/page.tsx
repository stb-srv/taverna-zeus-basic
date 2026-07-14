import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings, getOpeningHours } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import OpeningHours from "@/components/OpeningHours";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [settings, hours] = await Promise.all([getSettings(), getOpeningHours()]);
  const name = settings?.name ?? "Taverna Zeus";
  const description = settings ? localized(settings, "description", locale) : "";
  const hero = settings?.hero_image_url;

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-cover bg-center text-center text-white"
        style={hero ? { backgroundImage: `url(${hero})` } : undefined}
      >
        {!hero && <div className="bg-sunset absolute inset-0" />}
        {/* readability + warm glow overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/30" />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl px-4">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-gold drop-shadow">
            {t("greeting")}
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] drop-shadow-lg sm:text-7xl">
            {name}
          </h1>
          <p className="mt-4 font-display text-lg italic text-white/85 sm:text-xl">{t("tagline")}</p>
          {description && (
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-white/90">{description}</p>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="rounded-full bg-gradient-to-r from-gold to-accent px-8 py-3.5 font-medium text-white shadow-xl shadow-black/20 transition hover:scale-[1.03] hover:shadow-2xl"
            >
              {t("ctaMenu")}
            </Link>
            <Link
              href="/location"
              className="rounded-full border border-white/50 bg-white/10 px-8 py-3.5 font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t("viewLocation")}
            </Link>
          </div>
        </div>

        {/* smooth fade into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Opening hours + contact */}
      <section className="mx-auto -mt-10 grid max-w-5xl gap-8 px-4 pb-20 md:grid-cols-2">
        <div className="card-soft p-7">
          <h2 className="rule-gold mb-8 inline-block text-2xl">{t("openingHours")}</h2>
          <OpeningHours hours={hours} />
        </div>

        <div className="card-soft p-7">
          <h2 className="rule-gold mb-8 inline-block text-2xl">{t("findUs")}</h2>
          <address className="not-italic leading-relaxed text-foreground/80">
            {settings?.address_street && <div>{settings.address_street}</div>}
            {(settings?.address_zip || settings?.address_city) && (
              <div>
                {settings?.address_zip} {settings?.address_city}
              </div>
            )}
            {settings?.address_country && <div>{settings.address_country}</div>}
          </address>
          <div className="mt-4 space-y-1 text-sm">
            {settings?.phone && (
              <div>
                <span className="text-muted">{t("contact")}: </span>
                <a href={`tel:${settings.phone}`} className="text-primary hover:underline">
                  {settings.phone}
                </a>
              </div>
            )}
            {settings?.email && (
              <div>
                <a href={`mailto:${settings.email}`} className="text-primary hover:underline">
                  {settings.email}
                </a>
              </div>
            )}
          </div>
          <Link
            href="/location"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
          >
            {t("viewLocation")} →
          </Link>
        </div>
      </section>
    </>
  );
}
