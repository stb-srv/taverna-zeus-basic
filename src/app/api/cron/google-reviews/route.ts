import { syncGoogleReviews } from "@/lib/google-reviews";

// Optionaler Cron-Endpoint für den Google-Bewertungs-Import. Nicht zwingend
// nötig — der in-process Scheduler (src/instrumentation.ts) erledigt den
// täglichen Sync bereits. Dieser Endpoint erlaubt zusätzlich einen externen
// Cron (z. B. Coolify Scheduled Task): `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/google-reviews`.
//
// CRON_SECRET ist Pflicht: ohne Secret ist der Endpoint gesperrt, damit ihn
// nicht jeder von außen anstoßen kann. Der In-Process-Scheduler braucht ihn nicht.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncGoogleReviews({ force: false });
  return Response.json(result);
}
