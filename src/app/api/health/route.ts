// Health check endpoint for Coolify (and any other uptime monitor).
// The proxy matcher excludes /api, so this never gets a locale prefix.
export function GET() {
  return Response.json({ status: "ok" });
}
