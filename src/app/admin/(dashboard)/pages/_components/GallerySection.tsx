import { getTranslations } from "next-intl/server";
import GalleryUpload from "@/components/admin/GalleryUpload";
import type { Database } from "@/lib/supabase/types";

type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"];

/**
 * Wraps `GalleryUpload` with the section heading/hint copy, so the upload
 * component itself can stay focused on the list/upload mechanics.
 */
export default async function GallerySection({
  contextKey,
  images,
}: {
  contextKey: string;
  images: GalleryImageRow[];
}) {
  const t = await getTranslations("admin.gallery");

  return (
    <section className="max-w-2xl space-y-3">
      <div>
        <h2 className="font-display text-xl">{t("sectionTitle")}</h2>
        <p className="text-sm text-muted">{t("sectionHint")}</p>
      </div>
      <GalleryUpload contextKey={contextKey} images={images} />
    </section>
  );
}
