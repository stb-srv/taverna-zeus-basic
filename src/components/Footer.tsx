import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import SocialLinks from "./SocialLinks";
import type { Json } from "@/lib/supabase/types";

type Props = {
  restaurantName: string;
  phone: string | null;
  email: string | null;
  socialLinks?: Json | null;
};

export default async function Footer({ restaurantName, phone, email, socialLinks }: Props) {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="footer-blend relative mt-24 pt-28 text-white/75">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-accent text-sm font-bold text-white shadow-sm">
              Z
            </span>
            <span className="font-display text-lg font-semibold text-white">{restaurantName}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            {t("footer.rights")}
          </p>
        </div>

        <div className="text-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold/90">
            {t("home.contact")}
          </div>
          <div className="space-y-1.5">
            {phone && (
              <a href={`tel:${phone}`} className="block text-white/75 transition hover:text-white">
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="block text-white/75 transition hover:text-white">
                {email}
              </a>
            )}
          </div>
          <div className="mt-3">
            <SocialLinks links={socialLinks} />
          </div>
        </div>

        <div className="text-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold/90">
            {t("footer.legal")}
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link href="/impressum" className="text-white/75 transition hover:text-white">
                {t("nav.impressum")}
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="text-white/75 transition hover:text-white">
                {t("nav.datenschutz")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-glow relative py-5 text-center text-xs text-white/45">
        © {year} {restaurantName}
      </div>
    </footer>
  );
}
