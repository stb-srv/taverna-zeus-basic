import type { Metadata } from "next";
import { fontVars } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Meraki CMS · Admin",
  robots: { index: false, follow: false },
};

/** Root document for the non-localized /admin area (German UI). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-scroll-behavior="smooth" className={fontVars}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
