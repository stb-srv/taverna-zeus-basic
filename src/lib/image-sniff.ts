/**
 * Magic-byte detection for the image formats accepted as review photos.
 * The client compresses to WebP/JPEG, but the server must not trust the
 * client — this is what actually decides whether uploaded bytes are stored.
 */

export const MAX_REVIEW_PHOTOS = 5;
export const MAX_REVIEW_PHOTO_BYTES = 2 * 1024 * 1024;

export type SniffedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
};

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, header: number[], offset = 0): boolean {
  return header.every((b, i) => bytes[offset + i] === b);
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(bytes, PNG_HEADER)) return { mime: "image/png", ext: "png" };
  // WebP = RIFF container ("RIFF" ....) with "WEBP" form type at offset 8.
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
