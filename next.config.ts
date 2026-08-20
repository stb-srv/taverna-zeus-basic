import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CMS-Uploads liegen in Supabase Storage. Der erlaubte Bild-Host wird aus
// NEXT_PUBLIC_SUPABASE_URL abgeleitet (zur Build-Zeit als Build-Arg gesetzt),
// damit das Projekt ohne Code-Änderung für jedes Supabase-Projekt funktioniert.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image.
  output: "standalone",
  experimental: {
    serverActions: {
      // Bewertungsfotos laufen als multipart durch submitReview (max. 5 × 2 MB
      // + Textfelder). Gilt global für alle Server Actions — unkritisch, die
      // Spam-Guards laufen unabhängig davon.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    const securityHeaders = [
      // Defense-in-depth against clickjacking; `frame-ancestors` below is the
      // modern equivalent, this is the fallback for browsers that predate it.
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // CSP only in production: Next dev/HMR needs 'unsafe-eval' and a ws:
    // connection that aren't worth allowing in the policy actually meant to
    // constrain the deployed site.
    if (process.env.NODE_ENV === "production") {
      const supabaseOrigin = supabaseUrl ?? "";
      const csp = [
        "default-src 'self'",
        // ThemeScript/StructuredData render static/per-request inline
        // <script> tags without a nonce — 'unsafe-inline' is required.
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
        "font-src 'self' data:",
        `connect-src 'self' ${supabaseOrigin}`.trim(),
        // MapEmbed embeds an OpenStreetMap iframe behind cookie consent.
        "frame-src https://www.openstreetmap.org",
        "frame-ancestors 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ");
      securityHeaders.push({ key: "Content-Security-Policy", value: csp });
    }

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
