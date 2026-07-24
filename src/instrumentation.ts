/**
 * In-process Tages-Scheduler für den Google-Bewertungs-Import. Passt zur
 * Architektur dieser App (ein langlebiger Node-Prozess, Docker `standalone`,
 * ein Coolify-Container) — kein externer Cron nötig.
 *
 * Wir prüfen stündlich, aber syncGoogleReviews({ force: false }) respektiert
 * eine 24h-Sperre (Zeitstempel in restaurant_settings), sodass Google real
 * nur 1×/Tag abgefragt wird — auch über Neustarts hinweg.
 */
export async function register() {
  // Nur im Node-Runtime laufen (nicht Edge), und nur wenn ein Key gesetzt ist.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.GOOGLE_PLACES_API_KEY) return;

  const run = async () => {
    try {
      const { syncGoogleReviews } = await import("@/lib/google-reviews");
      const res = await syncGoogleReviews({ force: false });
      if (res.imported > 0) console.log(`[google-reviews] ${res.imported} neue Bewertung(en) importiert.`);
    } catch (e) {
      console.error("[google-reviews] Scheduler-Fehler:", e);
    }
  };

  // Start nicht blockieren; danach stündlich (die 24h-Sperre entscheidet real).
  setTimeout(run, 30_000);
  setInterval(run, 60 * 60 * 1000);
}
