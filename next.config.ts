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
};

export default withNextIntl(nextConfig);
