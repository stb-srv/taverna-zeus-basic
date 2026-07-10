import localFont from "next/font/local";

/**
 * EB Garamond — free (OFL) variable font by Georg Duffner, self-hosted from the
 * repo. No Google Fonts request is ever made. One typeface for the whole site
 * and admin (headings + body), exposed as `--font-eb-garamond`.
 */
export const ebGaramond = localFont({
  src: [
    { path: "../app/fonts/eb-garamond-latin.woff2", weight: "400 800", style: "normal" },
    { path: "../app/fonts/eb-garamond-latin-italic.woff2", weight: "400 800", style: "italic" },
  ],
  variable: "--font-eb-garamond",
  display: "swap",
});

/** className that exposes the font CSS variable on <html>. */
export const fontVars = ebGaramond.variable;
