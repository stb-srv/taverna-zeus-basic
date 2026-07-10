import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createMiddleware(routing);

// Next.js 16 renamed the "middleware" convention to "proxy".
export async function proxy(request: NextRequest) {
  // The /admin area is single-language and must not get a locale prefix;
  // only refresh the Supabase auth session there.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateSession(request, NextResponse.next({ request }));
  }

  // Run locale routing first, then refresh the Supabase session on its response.
  const response = handleI18n(request);
  return updateSession(request, response);
}

export const config = {
  // Skip Next internals, API routes and static assets.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
