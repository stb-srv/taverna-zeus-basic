import { describe, expect, it } from "vitest";
import { sniffImage } from "@/lib/image-sniff";

function bytes(...values: (number | string)[]): Uint8Array {
  const out: number[] = [];
  for (const v of values) {
    if (typeof v === "string") for (const ch of v) out.push(ch.charCodeAt(0));
    else out.push(v);
  }
  // Pad to the 12-byte minimum a real header check needs.
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
}

describe("sniffImage", () => {
  it("detects JPEG", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ mime: "image/jpeg", ext: "jpg" });
  });

  it("detects PNG", () => {
    expect(sniffImage(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toEqual({
      mime: "image/png",
      ext: "png",
    });
  });

  it("detects WebP (RIFF container with WEBP form type)", () => {
    expect(sniffImage(bytes("RIFF", 0x24, 0x00, 0x00, 0x00, "WEBP"))).toEqual({
      mime: "image/webp",
      ext: "webp",
    });
  });

  it("rejects buffers shorter than a full header", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
  });

  it("rejects junk bytes", () => {
    expect(sniffImage(bytes("this is not an image"))).toBeNull();
  });

  it("rejects a PNG first byte with the wrong remainder", () => {
    expect(sniffImage(bytes(0x89, "PNX", 0x0d, 0x0a, 0x1a, 0x0a))).toBeNull();
  });

  it("rejects a RIFF container that is not WebP (e.g. WAV)", () => {
    expect(sniffImage(bytes("RIFF", 0x24, 0x00, 0x00, 0x00, "WAVE"))).toBeNull();
  });
});
