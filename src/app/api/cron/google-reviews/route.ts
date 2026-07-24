import { syncGoogleReviews } from "@/lib/google-reviews";

// Optionaler Cron-Endpoint für den Google-Bewertungs-Import. Nicht zwingend
// nötig — der in-process Scheduler (src/instrumentation.ts) erledigt den
// täglichen Sync bereits. Dieser Endpoint erlaubt zusätzlich einen externen
// Cron (z. B. Coolify Scheduled Task): `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/google-reviews`.
//
// Ist CRON_SECRET gesetzt, wird es geprüft; ohne Secret bleibt der Endpoint
// offen, tut aber dank 24h-Sperre höchstens 1×/Tag etwas Reales.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await syncGoogleReviews({ force: false });
  return Response.json(result);
}
