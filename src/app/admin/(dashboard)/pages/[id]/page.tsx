import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getGalleryImages } from "@/lib/queries";
import PageForm from "../_components/PageForm";
import GallerySection from "../_components/GallerySection";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();
  const t = await getTranslations("admin.pages");
  const images = await getGalleryImages(`page:${id}`);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">{t("editPageTitle")}</h1>
      <PageForm page={page} />
      <div className="mt-8">
        <GallerySection contextKey={`page:${id}`} images={images} />
      </div>
    </div>
  );
}
