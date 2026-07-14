"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Props = {
  name: string;
  bucket: "site-images" | "menu-images";
  defaultUrl?: string | null;
  label?: string;
};

/** Uploads an image to Supabase Storage and stores its public URL in a hidden field. */
export default function ImageUpload({ name, bucket, defaultUrl, label }: Props) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const t = useTranslations("admin.imageUpload");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) {
      setError(upErr.message);
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    }
    setBusy(false);
  }

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-24 w-24 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
            {t("noImage")}
          </div>
        )}
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy}
            className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
          />
          {busy && <p className="text-xs text-muted">{t("uploading")}</p>}
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-xs text-accent hover:underline"
            >
              {t("remove")}
            </button>
          )}
          {error && (
            <p className="text-xs text-accent">
              {t("uploadFailedPrefix")} {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
