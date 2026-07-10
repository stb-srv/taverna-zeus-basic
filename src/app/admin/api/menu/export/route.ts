import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { collectMenu, imageFileName } from "@/lib/menu-transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Loads the bytes of an image, whether it is a local `/images/…` path or a remote URL. */
async function loadImage(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith("/")) {
      const abs = path.join(process.cwd(), "public", url.replace(/^\/+/, ""));
      const buf = await readFile(abs);
      return new Uint8Array(buf);
    }
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    return null;
  }
  return null;
}

const README = `Speisekarten-Export — Taverna Zeus (Meraki CMS)

Inhalt dieses Archivs:
  menu.json     Die vollständige Speisekarte (Kategorien, Speisen, Preise,
                Allergene, Zusatzstoffe) im JSON-Format.
  images/       Alle zur Speisekarte gehörenden Bilddateien.

Zum Wiederherstellen: Im CMS unter "Speisekarte → Import / Export" diese
ZIP-Datei auswählen und importieren. Die Bilder werden dabei automatisch
wieder hochgeladen.

ACHTUNG: Ein Import ersetzt die komplette Speisekarte.
`;

export async function GET() {
  const user = await getUser();
  if (!user) {
    return new Response("Nicht angemeldet", { status: 401 });
  }

  const supabase = await createClient();
  const manifest = await collectMenu(supabase);

  // Fetch every distinct image once, assign it a stable filename in the ZIP.
  const files: Record<string, Uint8Array> = {};
  const taken = new Set<string>();
  const urlToFile = new Map<string, string | null>();

  for (const item of manifest.items) {
    const url = item.image_url;
    if (!url) continue;

    if (!urlToFile.has(url)) {
      const bytes = await loadImage(url);
      if (bytes) {
        const name = imageFileName(url, taken);
        files[`images/${name}`] = bytes;
        urlToFile.set(url, `images/${name}`);
      } else {
        urlToFile.set(url, null);
      }
    }
    item.image_file = urlToFile.get(url) ?? null;
  }

  files["menu.json"] = strToU8(JSON.stringify(manifest, null, 2));
  files["README.txt"] = strToU8(README);

  const zipped = zipSync(files, { level: 6 });
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(zipped as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="speisekarte-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
