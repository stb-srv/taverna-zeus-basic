import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { autofillI18n } from "@/i18n/fields";
import { getEnabledLocales } from "@/i18n/locale-state";

// Offizielle Google Places API (New). Wir lesen NUR öffentliche
// Bewertungsdaten des eigenen Betriebs — konform mit den Nutzungsbedingungen,
// kein Scraping. Die API liefert pro Ort die (bis zu) 5 relevantesten
// Bewertungen; der tägliche Sync sammelt neue über die Zeit ein.
const PLACES_BASE = "https://places.googleapis.com/v1";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Rohform einer Bewertung aus der Places-API (nur die genutzten Felder). */
export type GoogleReviewRaw = {
  name?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
};

export type MappedReview = {
  external_id: string;
  author_name: string;
  rating: number;
  text: string;
  review_date: string | null;
};

/**
 * Reine Abbildung Places-API → DB-Zeile. Ohne Netzwerk/DB, damit sie
 * unit-testbar bleibt. Gibt null zurück, wenn Pflichtangaben fehlen
 * (kein stabiler Name, ungültiges Rating oder leerer Text).
 */
export function mapGoogleReview(raw: GoogleReviewRaw): MappedReview | null {
  const external_id = raw.name?.trim();
  if (!external_id) return null;

  const rating = raw.rating;
  if (!Number.isInteger(rating) || rating! < 1 || rating! > 5) return null;

  // originalText bevorzugen (Originalsprache); text ist Googles Übersetzung.
  const text = (raw.originalText?.text ?? raw.text?.text ?? "").trim();
  if (!text) return null;

  const author_name = (raw.authorAttribution?.displayName ?? "").trim() || "Google-Nutzer";
  const review_date = raw.publishTime ? raw.publishTime.slice(0, 10) : null;

  return { external_id, author_name, rating: rating!, text, review_date };
}

type SyncResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  reason?: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

/** Findet die Place ID (aus Cache oder per Text-Suche über Name + Adresse) und speichert sie. */
async function resolvePlaceId(
  admin: AdminClient,
  apiKey: string,
  settings: {
    google_place_id: string | null;
    name: string;
    address_street: string | null;
    address_zip: string | null;
    address_city: string | null;
  },
): Promise<string | null> {
  if (settings.google_place_id) return settings.google_place_id;

  const query = [settings.name, settings.address_street, settings.address_zip, settings.address_city]
    .filter(Boolean)
    .join(", ");
  if (!query) return null;

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) {
    console.error("[google-reviews] Text Search fehlgeschlagen:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { places?: { id?: string }[] };
  const placeId = data.places?.[0]?.id ?? null;
  if (placeId) {
    await admin.from("restaurant_settings").update({ google_place_id: placeId }).eq("id", 1);
  }
  return placeId;
}

/** Holt die aktuellen Bewertungen (bis zu 5) für die Place ID. */
async function fetchPlaceReviews(apiKey: string, placeId: string): Promise<GoogleReviewRaw[]> {
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
  });
  if (!res.ok) {
    console.error("[google-reviews] Place Details fehlgeschlagen:", res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as { reviews?: GoogleReviewRaw[] };
  return data.reviews ?? [];
}

/** Übersetzt den Bewertungstext in die aktivierten Sprachen (best-effort). */
async function buildTranslations(source: string): Promise<{ i18n: Record<string, string>; en?: string }> {
  try {
    const { result } = await autofillI18n(
      { review_text: { i18n: {}, source } },
      { targets: await getEnabledLocales() },
    );
    const map = result.review_text;
    return { i18n: map, en: typeof map.en === "string" ? map.en : undefined };
  } catch (e) {
    console.error("[google-reviews] Übersetzung fehlgeschlagen:", e);
    return { i18n: {} };
  }
}

/**
 * Importiert neue Google-Bewertungen. Läuft best-effort — wirft nie, damit
 * weder der Scheduler noch ein API-Aufruf daran hängenbleibt.
 *
 * `force: false` respektiert die 24h-Sperre (für den stündlichen Scheduler /
 * Cron-Endpoint); `force: true` erzwingt einen sofortigen Abgleich (Admin-Button).
 */
export async function syncGoogleReviews({ force }: { force: boolean }): Promise<SyncResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { ok: false, imported: 0, skipped: 0, reason: "no_api_key" };

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, imported: 0, skipped: 0, reason: "no_service_role" };
  }

  const { data: settings } = await admin
    .from("restaurant_settings")
    .select(
      "name, address_street, address_zip, address_city, google_place_id, google_reviews_synced_at",
    )
    .eq("id", 1)
    .maybeSingle();
  if (!settings) return { ok: false, imported: 0, skipped: 0, reason: "no_settings" };

  if (!force && settings.google_reviews_synced_at) {
    const age = Date.now() - new Date(settings.google_reviews_synced_at).getTime();
    if (age < SYNC_INTERVAL_MS) return { ok: true, imported: 0, skipped: 0, reason: "recent" };
  }

  const placeId = await resolvePlaceId(admin, apiKey, settings);
  if (!placeId) return { ok: false, imported: 0, skipped: 0, reason: "no_place_id" };

  const raw = await fetchPlaceReviews(apiKey, placeId);

  // Zeitstempel immer setzen (auch bei 0 neuen), damit die 24h-Sperre greift.
  await admin
    .from("restaurant_settings")
    .update({ google_reviews_synced_at: new Date().toISOString() })
    .eq("id", 1);

  let imported = 0;
  let skipped = 0;
  for (const item of raw) {
    const mapped = mapGoogleReview(item);
    if (!mapped) {
      skipped++;
      continue;
    }

    const { data: existing } = await admin
      .from("reviews")
      .select("id")
      .eq("external_id", mapped.external_id)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const { i18n, en } = await buildTranslations(mapped.text);
    const { error } = await admin.from("reviews").insert({
      external_id: mapped.external_id,
      author_name: mapped.author_name,
      rating: mapped.rating,
      review_text_de: mapped.text,
      review_text_en: en ?? null,
      review_text_i18n: i18n,
      review_date: mapped.review_date,
      source: "google",
      is_published: true,
      sort_order: 0,
    });
    if (error) {
      console.error("[google-reviews] Insert fehlgeschlagen:", error.code, error.message);
      skipped++;
      continue;
    }
    imported++;
  }

  return { ok: true, imported, skipped };
}
