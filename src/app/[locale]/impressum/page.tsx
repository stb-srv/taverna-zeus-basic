import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import Markdown from "@/components/Markdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const page = await getPage("impressum");
  return { title: page ? localized(page, "title", locale) : "Impressum" };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getPage("impressum");
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-gradient mb-8 text-5xl">{localized(page, "title", locale)}</h1>
      <Markdown content={localized(page, "content", locale)} />
    </article>
  );
}
