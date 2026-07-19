import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getSettings, getOpeningHours, getKitchenHours } from "@/lib/queries";
import OpeningHours from "@/components/OpeningHours";
import MapEmbed from "@/components/MapEmbed";
import ContactForm from "./ContactForm";

export async function generateMetadata() {
  const t = await getTranslations("location");
  return { title: t("title") };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("location");

  const [settings, hours, kitchenHours] = await Promise.all([
    getSettings(),
    getOpeningHours(),
    getKitchenHours(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-gradient mb-10 text-5xl">{t("title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <section className="card-soft p-6">
            <h2 className="rule-gold mb-6 inline-block text-xl">{t("address")}</h2>
            <address className="not-italic leading-relaxed text-foreground/80">
              {settings?.address_street && <div>{settings.address_street}</div>}
              {(settings?.address_zip || settings?.address_city) && (
                <div>
                  {settings?.address_zip} {settings?.address_city}
                </div>
              )}
              {settings?.address_country && <div>{settings.address_country}</div>}
            </address>
          </section>

          <section className="card-soft p-6">
            <h2 className="rule-gold mb-6 inline-block text-xl">{t("contact")}</h2>
            <dl className="space-y-2 text-sm">
              {settings?.phone && (
                <div className="flex gap-2">
                  <dt className="w-20 text-muted">{t("phone")}</dt>
                  <dd>
                    <a href={`tel:${settings.phone}`} className="text-primary hover:underline">
                      {settings.phone}
                    </a>
                  </dd>
                </div>
              )}
              {settings?.email && (
                <div className="flex gap-2">
                  <dt className="w-20 text-muted">{t("email")}</dt>
                  <dd>
                    <a href={`mailto:${settings.email}`} className="text-primary hover:underline">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card-soft p-6">
            <h2 className="rule-gold mb-6 inline-block text-xl">{t("openingHours")}</h2>
            <OpeningHours hours={hours} kitchenHours={settings?.kitchen_hours_enabled ? kitchenHours : []} />
          </section>
        </div>

        <div className="space-y-6">
          <MapEmbed embedUrl={settings?.google_maps_embed ?? null} />

          <section className="card-soft p-6">
            <h2 className="rule-gold mb-6 inline-block text-xl">{t("contactFormHeading")}</h2>
            <p className="mb-4 text-sm text-muted">{t("reservationNotice")}</p>
            <ContactForm locale={locale} />
          </section>
        </div>
      </div>
    </div>
  );
}
