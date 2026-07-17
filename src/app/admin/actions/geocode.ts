import "server-only";

/**
 * Server-side geocoding via Nominatim (OpenStreetMap). Runs only when the
 * admin saves the settings, so no visitor data ever reaches a third party.
 * Nominatim's usage policy (≤1 req/s, identifying User-Agent) is easily met
 * by this save-time, single-request usage.
 */

type Address = {
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string | null;
};

/** Rough map extent around the marker (~500 m × ~500 m at central European latitudes). */
const D_LAT = 0.0025;
const D_LON = 0.006;

/**
 * Builds an OpenStreetMap embed URL (for `MapEmbed`) from the restaurant
 * address. Tolerant by design: returns `null` if the address is empty, the
 * lookup fails, or nothing is found — callers keep whatever was stored before.
 */
export async function buildOsmEmbedUrl(addr: Address): Promise<string | null> {
  const query = [addr.street, [addr.zip, addr.city].filter(Boolean).join(" "), addr.country]
    .filter(Boolean)
    .join(", ");
  if (!query) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": "taverna-zeus-website/1.0 (admin settings geocoding)" },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const lat = Number(data[0]?.lat);
    const lon = Number(data[0]?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const bbox = [lon - D_LON, lat - D_LAT, lon + D_LON, lat + D_LAT]
      .map((n) => n.toFixed(6))
      .join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lon.toFixed(6)}`;
  } catch {
    return null;
  }
}
