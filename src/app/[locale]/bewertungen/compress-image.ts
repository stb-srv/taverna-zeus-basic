/**
 * Browser-side photo compression for the review form: scale to max 1600px
 * and re-encode until the result is reasonably small, so five photos fit
 * comfortably through the server action and storage stays lean. Re-encoding
 * also strips EXIF metadata (incl. GPS) and `imageOrientation: "from-image"`
 * bakes the rotation in. Deliberately colocated with the form — canvas APIs
 * don't exist in the vitest/node environment.
 *
 * Returns null when the browser cannot decode the file (e.g. HEIC on
 * Chrome) — the caller decides whether the original is acceptable as-is.
 */

const MAX_DIM = 1600;
const TARGET_BYTES = 500 * 1024;
const QUALITIES = [0.8, 0.65, 0.5];

function toBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<Blob | null> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    return null;
  }
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();

  // Safari encodes no WebP and silently falls back to PNG (huge for photos) —
  // detect that via blob.type and switch to JPEG instead.
  for (const type of ["image/webp", "image/jpeg"]) {
    for (const quality of QUALITIES) {
      const blob = await toBlobAsync(canvas, type, quality);
      if (!blob || blob.type !== type) break;
      if (blob.size <= TARGET_BYTES || quality === QUALITIES[QUALITIES.length - 1]) return blob;
    }
  }
  return null;
}
