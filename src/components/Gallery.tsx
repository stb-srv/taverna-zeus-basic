"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/i18n/localized-content";
import type { Database } from "@/lib/supabase/types";

type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"];

/** Public photo gallery with a click-to-open lightbox. Renders nothing when empty. */
export default function Gallery({ images, locale }: { images: GalleryImageRow[]; locale: Locale }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex]);

  if (images.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="card-soft relative aspect-square overflow-hidden rounded-xl p-0"
          >
            <Image
              src={img.image_url}
              alt={localized(img, "alt", locale)}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 text-3xl text-white"
            aria-label="Close"
          >
            ×
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[openIndex].image_url}
              alt={localized(images[openIndex], "alt", locale)}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
