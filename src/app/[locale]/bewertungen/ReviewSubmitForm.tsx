"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { submitReview, type ReviewState } from "../actions/review";
import { compressImage } from "./compress-image";
import { MAX_REVIEW_PHOTOS, MAX_REVIEW_PHOTO_BYTES } from "@/lib/image-sniff";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1 block text-sm font-medium";

const initial: ReviewState = {};
const KEEPABLE_ORIGINALS = ["image/jpeg", "image/png", "image/webp"];

type PendingPhoto = { file: File; previewUrl: string };

export default function ReviewSubmitForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(submitReview, initial);
  // Captured once at mount — the timing-trap in the server action rejects
  // submits faster than a human could plausibly fill the form. A non-JS bot
  // that POSTs directly without ever rendering this component leaves the
  // field empty, which the action also treats as a fail.
  const [renderedAt] = useState(() => Date.now());
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const t = useTranslations("reviews");

  async function onPhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = "";
    if (files.length === 0) return;

    setPhotoError(null);
    setCompressing(true);
    try {
      for (const file of files) {
        if (photosRef.current.length >= MAX_REVIEW_PHOTOS) {
          setPhotoError(t("photosTooMany"));
          break;
        }
        const compressed = await compressImage(file);
        let keep: Blob | null = compressed;
        if (!keep) {
          // Browser konnte die Datei nicht dekodieren (z. B. HEIC auf
          // Chrome) — Original nur behalten, wenn es Format und Limit erfüllt.
          if (KEEPABLE_ORIGINALS.includes(file.type) && file.size <= MAX_REVIEW_PHOTO_BYTES) {
            keep = file;
          } else {
            setPhotoError(t("photoUnsupported", { name: file.name }));
            continue;
          }
        }
        const ext = keep.type === "image/webp" ? "webp" : keep.type === "image/png" ? "png" : "jpg";
        const wrapped = new File([keep], `photo.${ext}`, { type: keep.type });
        setPhotos((prev) =>
          prev.length >= MAX_REVIEW_PHOTOS
            ? prev
            : [...prev, { file: wrapped, previewUrl: URL.createObjectURL(wrapped) }],
        );
      }
    } finally {
      setCompressing(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setPhotoError(null);
  }

  if (state.ok) {
    return <p className="text-sm text-primary">{t("success")}</p>;
  }

  return (
    <form
      action={(fd) => {
        photos.forEach((p) => fd.append("photos", p.file));
        action(fd);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="form_rendered_at" value={renderedAt} />
      {/* Honeypot — hidden from real visitors, left empty by them. Bots that
          fill every field will trip this. */}
      <div className="absolute h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="review_website">Website</label>
        <input
          id="review_website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="review_first_name">
            {t("firstName")}
          </label>
          <input id="review_first_name" name="first_name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="review_last_name">
            {t("lastName")}
          </label>
          <input id="review_last_name" name="last_name" className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="review_email">
            {t("email")}
          </label>
          <input id="review_email" name="email" type="email" required className={inputCls} />
          <p className="mt-1 text-xs text-muted">{t("emailNotice")}</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="review_rating">
            {t("rating")}
          </label>
          <select id="review_rating" name="rating" defaultValue={5} className={inputCls}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
                {"☆".repeat(5 - n)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="review_text">
          {t("reviewText")}
        </label>
        <textarea
          id="review_text"
          name="review_text"
          required
          rows={5}
          maxLength={2000}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="review_photos">
          {t("photosLabel")}
        </label>
        {/* Kein name-Attribut: Die (ggf. großen) Originale werden nie
            mitgesendet — nur die komprimierten Dateien aus dem State werden
            beim Submit ans FormData angehängt. */}
        <input
          id="review_photos"
          type="file"
          accept="image/*"
          multiple
          disabled={photos.length >= MAX_REVIEW_PHOTOS || compressing || pending}
          onChange={onPhotosSelected}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-muted">
          {compressing ? t("photosCompressing") : t("photosHint")}
        </p>
        {photos.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <li key={p.previewUrl} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale Object-URL, next/image nicht anwendbar */}
                <img
                  src={p.previewUrl}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={t("photoRemove")}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs leading-none text-white shadow"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {photoError && <p className="mt-1 text-sm text-accent">{photoError}</p>}
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || compressing}
        className="rounded-full bg-gradient-to-r from-gold to-accent px-8 py-3 font-medium text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
