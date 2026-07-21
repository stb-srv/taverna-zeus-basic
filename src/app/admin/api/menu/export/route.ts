import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { collectMenu, imageFileName } from "@/lib/menu-transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rejects hosts that resolve into private/loopback/link-local ranges (SSRF guard). */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".localhost") || h.endsWith(".internal")) {
    return true;
  }
  // IPv4 literals in private / loopback / link-local ranges.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return true; // loopback / private / this-host
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
  }
  // IPv6 loopback / unique-local / link-local.
  if (h === "::1" || h.startsWith("[::1]") || h.startsWith("fd") || h.startsWith("fe80")) {
    return true;
  }
  return false;
}

/**
 * Loads the bytes of an image, whether it is a local `/images/…` path or a
 * remote URL. Hardened against two admin-supplied-URL abuses: path traversal
 * out of `public/` (local reads) and SSRF to internal hosts (remote fetches).
 */
async function loadImage(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith("/")) {
      const publicDir = path.join(process.cwd(), "public");
      const abs = path.resolve(publicDir, `.${url}`);
      // Ensure the resolved path stays inside public/ (blocks ../ traversal).
      if (abs !== publicDir && !abs.startsWith(publicDir + path.sep)) return null;
      const buf = await readFile(abs);
      return new Uint8Array(buf);
    }
    if (/^https?:\/\//i.test(url)) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return null;
      }
      if (isBlockedHost(parsed.hostname)) return null;
      const res = await fetch(url, { redirect: "error" });
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
  // The full menu export is an admin-only capability — verify allowlist
  // membership, not just that someone is logged in.
  const { data: isAdmin } = await supabase
    .from("admins")
    .select("email")
    .eq("email", (user.email ?? "").toLowerCase())
    .maybeSingle();
  if (!isAdmin) {
    return new Response("Keine Admin-Berechtigung.", { status: 403 });
  }

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
