"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  addGalleryImage,
  deleteGalleryImage,
  reorderGalleryImage,
  updateGalleryImageAlt,
} from "@/app/admin/actions/gallery";
import { btnGhost, btnDanger } from "@/components/admin/ui-classes";
import type { Database } from "@/lib/supabase/types";

type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"];

/**
 * Admin-facing multi-image manager for a gallery `context_key` (e.g. `page:<id>`).
 * Manages its own list independently of any parent form: every mutation calls its
 * server action directly and then `router.refresh()`, since `revalidatePublic()`
 * only refreshes the public site, not this admin route.
 */
export default function GalleryUpload({
  contextKey,
  images,
}: {
  contextKey: string;
  images: GalleryImageRow[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("admin.gallery");
  const tu = useTranslations("admin.imageUpload");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("gallery-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      e.target.value = "";
      return;
    }
    const { data } = supabase.storage.from("gallery-images").getPublicUrl(path);
    const fd = new FormData();
    fd.set("context_key", contextKey);
    fd.set("image_url", data.publicUrl);
    const result = await addGalleryImage({}, fd);
    if (result?.error) setError(result.error);
    setBusy(false);
    e.target.value = "";
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const fd = new FormData();
    fd.set("id", id);
    await deleteGalleryImage(fd);
    router.refresh();
  }

  async function onReorder(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    await reorderGalleryImage(fd);
    router.refresh();
  }

  async function onAltBlur(id: string, value: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("alt_de", value);
    await updateGalleryImageAlt(fd);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("uploadLabel")}</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={busy}
          className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
        />
        {busy && <p className="mt-1 text-xs text-muted">{tu("uploading")}</p>}
        {error && (
          <p className="mt-1 text-xs text-accent">
            {tu("uploadFailedPrefix")} {error}
          </p>
        )}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted">{t("noImages")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="space-y-2 rounded-xl border border-border bg-card p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="" className="h-28 w-full rounded-lg object-cover" />
              <input
                type="text"
                defaultValue={img.alt_de ?? ""}
                placeholder={t("altPlaceholder")}
                onBlur={(e) => onAltBlur(img.id, e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
              />
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onReorder(img.id, "up")}
                    disabled={i === 0}
                    className={`${btnGhost} px-2 py-1 disabled:opacity-30`}
                    aria-label={t("moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorder(img.id, "down")}
                    disabled={i === images.length - 1}
                    className={`${btnGhost} px-2 py-1 disabled:opacity-30`}
                    aria-label={t("moveDown")}
                  >
                    ↓
                  </button>
                </div>
                <button type="button" onClick={() => onDelete(img.id)} className={btnDanger}>
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
